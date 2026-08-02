import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// EXTENSION DETECTION — HONEST ANALYSIS
// ─────────────────────────────────────────────────────────────────────────────
//
// The GNB Edge extension manifest (v0.0.0.1) does NOT declare:
//   • externally_connectable  → chrome.runtime.sendMessage from web pages FAILS
//   • web_accessible_resources → chrome-extension:// image/fetch probes FAIL
//   • content_scripts for this origin → DOM marker injection NEVER happens here
//
// This means ALL programmatic detection is structurally impossible from the
// frontend alone without modifying the extension. This is a Chrome security
// feature, not a bug. The timeout always fires and resolves 'not_installed'.
//
// BEST-EFFORT layers are still attempted below in case the extension is updated:
//   Layer 1 — chrome.runtime.sendMessage (needs externally_connectable)
//   Layer 2 — DOM attribute probe        (needs content script on this origin)
//   Layer 3 — Resource image probe       (needs web_accessible_resources)
//   Layer 4 — fetch() text probe         (same requirement as Layer 3)
//
// PRODUCTION FALLBACK (what Notion / Figma / Linear do):
//   When all layers time out, surface a manual "I've installed it" confirmation
//   checkbox. The user is never blocked from continuing. The detection result is
//   advisory, not a hard gate.
//
// TO FIX PROPERLY: Add to the extension manifest →
//   "web_accessible_resources": [{ "resources": ["icons/icon16.png"], "matches": ["<all_urls>"] }]
//   OR "externally_connectable": { "matches": ["https://app.gnbedge.in/*"] }
// ─────────────────────────────────────────────────────────────────────────────

const EXTENSION_ID = 'nkcdcfebmemgkjkgbdiioalkpgejanln';
const STORE_URL    = `https://chromewebstore.google.com/detail/gnbedge/${EXTENSION_ID}`;

// Probe timeout: how long to wait before giving up on programmatic detection.
const PROBE_TIMEOUT_MS = 3000;

// Debounce delay for focus/visibilitychange re-checks (avoids hammering on
// rapid tab switches or window blurs in multi-monitor setups).
const RECHECK_DEBOUNCE_MS = 600;

// ─────────────────────────────────────────────────────────────────────────────

const StepInstallExtension = ({ onNext, onBack }) => {
    // 'unknown' | 'installed' | 'undetectable' | 'not_installed'
    // 'undetectable' = all layers timed out (detection is impossible without extension changes)
    const [status,    setStatus]    = useState('unknown');
    const [checking,  setChecking]  = useState(false);
    // User clicked "I've installed it" manual confirmation
    const [confirmed, setConfirmed] = useState(false);

    // Refs for cleanup and race-condition prevention
    const mountedRef     = useRef(true);
    const checkingRef    = useRef(false);   // prevents overlapping check runs
    const timeoutRef     = useRef(null);    // probe timeout handle
    const debounceRef    = useRef(null);    // recheck debounce handle

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            mountedRef.current = false;
            clearTimeout(timeoutRef.current);
            clearTimeout(debounceRef.current);
        };
    }, []);

    // ─── Core detection function ───────────────────────────────────────────
    const checkExtension = useCallback(() => {
        if (!mountedRef.current) return;
        // Prevent overlapping runs — if a check is already in progress, ignore
        if (checkingRef.current) return;

        checkingRef.current = true;
        setChecking(true);
        setStatus('unknown');

        // Clear any pending timeout from a previous run
        clearTimeout(timeoutRef.current);

        let resolved = false;

        const resolve = (result) => {
            // 'installed' | 'undetectable' | 'not_installed'
            if (resolved || !mountedRef.current) return;
            resolved = true;
            checkingRef.current = false;
            clearTimeout(timeoutRef.current);
            setStatus(result);
            setChecking(false);
        };

        // ── Layer 1: chrome.runtime.sendMessage ──────────────────────────────
        // Requires: manifest "externally_connectable.matches" includes this origin.
        // Current extension: NOT configured → always throws "Could not establish
        // connection" (caught silently). Does NOT indicate extension is absent.
        const tryRuntime = () => {
            if (typeof chrome === 'undefined' || !chrome?.runtime?.sendMessage) return;
            try {
                chrome.runtime.sendMessage(EXTENSION_ID, { type: 'PING' }, (response) => {
                    if (resolved || !mountedRef.current) return;
                    const err = chrome.runtime.lastError; // must read to suppress console error
                    if (!err && response != null) {
                        resolve('installed');
                    }
                    // lastError present = extension missing OR externally_connectable not set.
                    // We can't distinguish these, so don't resolve false — let timeout decide.
                });
            } catch {
                // Thrown on non-Chromium browsers (Firefox, Safari). Ignore.
            }
        };

        // ── Layer 2: DOM attribute injected by content script ────────────────
        // Requires: a content script matching this origin sets:
        //   document.documentElement.setAttribute('data-gnbedge', 'true')
        // Current extension: content scripts only match fleetedge.home.tatamotors
        // → never runs here. Safe to keep as a forward-compatible check.
        const tryDOMMarker = () => {
            if (document.documentElement.hasAttribute('data-gnbedge')) {
                resolve('installed');
                return true;
            }
            return false;
        };

        // ── Layer 3: Resource image probe ────────────────────────────────────
        // Requires: manifest "web_accessible_resources" lists the icon file AND
        //   matches this page's origin. Without this, Chrome returns a blank
        //   response (not a 404) and img.onerror fires regardless. The probe
        //   cannot distinguish "extension absent" from "extension installed but
        //   resource not declared".
        // Current extension: NO web_accessible_resources at all → always onerror.
        const tryImageProbe = () => {
            // Only attempt on Chromium (chrome-extension:// scheme is Chromium-only)
            if (typeof chrome === 'undefined') return;
            const img = new Image();
            img.onload  = () => { if (!resolved) resolve('installed'); };
            img.onerror = () => { /* cannot distinguish absent vs blocked */ };
            // Use a cache-busting param so the browser doesn't cache a failed load
            img.src = `chrome-extension://${EXTENSION_ID}/icons/icon16.png?_=${Date.now()}`;
        };

        // ── Layer 4: fetch() probe (alternative to image probe) ──────────────
        // fetch() to a chrome-extension:// URL from a web page is blocked by CORS
        // unless the resource is in web_accessible_resources. The network error
        // is indistinguishable from "not installed". Skipped here because it
        // provides no additional signal vs Layer 3 and adds noise.
        // (Kept as a comment for documentation purposes.)

        // ── Run all layers ───────────────────────────────────────────────────
        tryRuntime();
        if (!tryDOMMarker()) {
            tryImageProbe();
        }

        // ── Timeout: resolve as 'undetectable' (not 'not_installed') ─────────
        // We deliberately use 'undetectable' instead of 'not_installed' because
        // we cannot confirm the extension is absent — detection is simply blocked
        // by Chrome security policy. This avoids a false-negative UX message.
        timeoutRef.current = setTimeout(() => {
            if (!resolved && mountedRef.current) {
                resolve('undetectable');
            }
        }, PROBE_TIMEOUT_MS);
    }, []); // stable — no deps change after mount

    // ─── Debounced re-check on tab return ─────────────────────────────────
    // Debounce prevents multiple rapid firings when the user alt-tabs or the
    // browser emits both visibilitychange AND focus in quick succession.
    const scheduleRecheck = useCallback(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            if (mountedRef.current && !checkingRef.current) {
                checkExtension();
            }
        }, RECHECK_DEBOUNCE_MS);
    }, [checkExtension]);

    // ─── Mount: initial check + event listeners ────────────────────────────
    useEffect(() => {
        checkExtension();

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') scheduleRecheck();
        };
        const handleFocus = () => scheduleRecheck();

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [checkExtension, scheduleRecheck]);

    // ─── Derived display state ─────────────────────────────────────────────
    // The user can proceed if: extension was auto-detected OR manually confirmed.
    const canProceed = status === 'installed' || confirmed;

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="ob-step-body">
            <div className="ob-step-header">
                <h2>Add the GNB Edge Extension</h2>
                <p>Install the extension to pull fleet data seamlessly.</p>
            </div>

            {/* Browser mockup */}
            <div className="ob-ext-mockup">
                <div className="ob-ext-browser">
                    <div className="ob-ext-browser-bar">
                        <span className="ob-ext-dot ob-ext-dot--red"    />
                        <span className="ob-ext-dot ob-ext-dot--yellow" />
                        <span className="ob-ext-dot ob-ext-dot--green"  />
                    </div>
                    <div className="ob-ext-browser-content">
                        <div className="ob-ext-address-row">
                            <div className="ob-ext-address-bar">
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                    <circle cx="5" cy="5" r="4" stroke="#9CA3AF" strokeWidth="1.2"/>
                                    <path d="M8.5 8.5L11 11" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round"/>
                                </svg>
                                <span>chromewebstore.google.com</span>
                            </div>
                            <div className="ob-ext-toolbar">
                                <div className="ob-ext-pin-icon" title="Extensions">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path d="M10.5 2L14 5.5L9 7L7 9L5.5 14L2 10.5L7 5L10.5 2Z" stroke="#6B7280" strokeWidth="1.2" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                                <div className="ob-ext-active-icon" title="GNB Edge pinned">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <rect width="16" height="16" rx="3" fill="#1E293B"/>
                                        <path d="M4 8L7 11L12 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div className="ob-ext-arrow-area">
                            <svg className="ob-ext-arrow-svg" viewBox="0 0 120 60" fill="none">
                                <path d="M20 50 Q60 10 100 28" stroke="#4F46E5" strokeWidth="2" strokeDasharray="5 3" fill="none"/>
                                <path d="M96 22 L100 28 L94 28" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                            </svg>
                            <span className="ob-ext-arrow-label">Pin the extension here</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Status badge ── */}
            {checking && (
                <div className="ob-status ob-status--checking">
                    <span className="ob-btn-spinner" style={{ borderTopColor: '#475569' }} />
                    Checking for GNB Edge extension…
                </div>
            )}

            {!checking && status === 'installed' && (
                <div className="ob-status ob-status--success">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" fill="#D1FAE5"/>
                        <path d="M5 8L7 10L11 6" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    GNB Edge extension detected and active — you're good to go!
                </div>
            )}

            {/* 'undetectable' or 'not_installed': show manual confirmation instead of a hard error */}
            {!checking && (status === 'undetectable' || status === 'not_installed') && (
                <div className="ob-status ob-status--warn" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M8 1L15 14H1L8 1Z" fill="#FEF3C7"/>
                            <path d="M8 6V9M8 11H8.01" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        <span>
                            {status === 'undetectable'
                                ? "Extension detection is limited by browser security. Already installed?"
                                : "Extension not detected. Already installed?"}
                        </span>
                    </div>

                    {/* Manual confirmation checkbox — the production-safe fallback */}
                    <label
                        htmlFor="ext-confirm"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            color: '#374151',
                            fontWeight: confirmed ? 600 : 400,
                        }}
                    >
                        <input
                            id="ext-confirm"
                            type="checkbox"
                            checked={confirmed}
                            onChange={(e) => setConfirmed(e.target.checked)}
                            style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#4F46E5' }}
                        />
                        Yes, I've installed the GNB Edge extension
                    </label>
                </div>
            )}

            {/* ── CTA buttons ── */}
            <div className="ob-ext-actions">
                <a
                    href={STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ob-btn ob-btn--dark ob-btn--icon"
                >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <rect width="18" height="18" rx="4" fill="white" fillOpacity="0.15"/>
                        <path d="M6 9H12M9 6L12 9L9 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Add to Chrome
                </a>

                <button
                    type="button"
                    className="ob-btn ob-btn--ghost"
                    onClick={checkExtension}
                    disabled={checking}
                >
                    {checking ? (
                        <>
                            <span className="ob-btn-spinner" />
                            Checking…
                        </>
                    ) : (
                        <>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M1 7C1 3.68 3.68 1 7 1C9.28 1 11.26 2.25 12.3 4.1M13 7C13 10.32 10.32 13 7 13C4.72 13 2.74 11.75 1.7 9.9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                                <path d="M11 1.5L12.3 4.1L9.7 4.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Check again
                        </>
                    )}
                </button>
            </div>

            <p className="ob-ext-footnote">Works on Chrome, Brave, and Edge. You can turn it off anytime.</p>

            <div className="ob-step-footer">
                <button type="button" className="ob-btn ob-btn--ghost ob-btn--back" onClick={onBack}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Back
                </button>
                <button
                    type="button"
                    className="ob-btn ob-btn--dark"
                    onClick={onNext}
                    disabled={!canProceed}
                    title={!canProceed ? 'Please install the extension or confirm it is installed to continue' : ''}
                    style={{ opacity: canProceed ? 1 : 0.5, cursor: canProceed ? 'pointer' : 'not-allowed' }}
                >
                    Continue
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M5 2L10 7L5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default StepInstallExtension;