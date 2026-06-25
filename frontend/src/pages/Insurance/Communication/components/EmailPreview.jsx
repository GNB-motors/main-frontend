import React from 'react';
import { PLACEHOLDERS } from '../../insuranceConstants';

// The module's signature element: a realistic branded email envelope that
// updates live as branding/signature/template are edited. {{tokens}} render as
// highlighted chips showing sample values, so it reads like a real send.
const PREVIEW_CSS = `
.epv-chip{display:inline-block;padding:0 6px;border-radius:6px;background:#eef2ff;
  color:#4f46e5;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;font-weight:600;}
.epv-body a{color:#2563eb;text-decoration:underline;}
.epv-body p{margin:0 0 8px;}
.epv-body ul,.epv-body ol{margin:0 0 8px 18px;}
`;

function renderTokens(html) {
  const clean = (html || '').replace(/<script[\s\S]*?<\/script>/gi, '');
  return clean.replace(/\{\{(\w+)\}\}/g, (m) => {
    const def = PLACEHOLDERS.find((p) => p.token === m);
    return `<span class="epv-chip">${def ? def.sample : m}</span>`;
  });
}

const SAMPLE_BODY =
  '<p>Hi {{CustomerName}},</p><p>Thank you for your interest. Please find your insurance details below. ' +
  'Feel free to reach out with any questions.</p>';

export default function EmailPreview({
  fromName,
  fromEmail,
  logoUrl,
  subject,
  bodyHtml,
  signatureHtml,
  mode = 'branding',
}) {
  const body = mode === 'template' ? bodyHtml : SAMPLE_BODY;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <style>{PREVIEW_CSS}</style>
      {/* faux mail client chrome */}
      <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-4 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        <span className="ml-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Email preview</span>
      </div>

      {/* headers */}
      <div className="space-y-1 border-b border-slate-100 px-5 py-3 font-mono text-xs text-slate-500">
        <div>
          <span className="text-slate-400">From: </span>
          <span className="text-slate-700">{fromName || 'Your Company'}</span>
          <span className="text-slate-400"> &lt;{fromEmail || 'you@company.com'}&gt;</span>
        </div>
        <div>
          <span className="text-slate-400">To: </span>
          <span className="text-slate-700">rajesh@example.com</span>
        </div>
        <div className="truncate">
          <span className="text-slate-400">Subject: </span>
          <span
            className="font-sans font-semibold text-slate-800"
            dangerouslySetInnerHTML={{ __html: renderTokens(subject || (mode === 'template' ? 'Your subject line' : 'Your insurance update')) }}
          />
        </div>
      </div>

      {/* body */}
      <div className="px-5 py-4">
        <div className="epv-body text-sm leading-relaxed text-slate-700" dangerouslySetInnerHTML={{ __html: renderTokens(body) }} />

        {/* branded signature footer */}
        <div className="mt-5 border-t border-dashed border-slate-200 pt-4">
          {logoUrl ? (
            <img src={logoUrl} alt="Company logo" className="mb-2 max-h-12 w-auto object-contain" />
          ) : null}
          {signatureHtml ? (
            <div className="epv-body text-sm text-slate-600" dangerouslySetInnerHTML={{ __html: renderTokens(signatureHtml) }} />
          ) : (
            <div className="text-xs italic text-slate-300">Your signature will appear here</div>
          )}
        </div>
      </div>
    </div>
  );
}
