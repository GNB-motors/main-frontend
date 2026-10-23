import { useId, useRef, useState } from 'react';
import { Check, Send } from 'lucide-react';
import ContactChannels from './contact-form/ContactChannels.jsx';
import { sendEnquiry } from '../enquiryService.js';
import { SUPPORT_EMAIL } from '../../../Support/supportContact.js';
import {
  EMPTY_ENQUIRY,
  ENQUIRY_FLEET_SIZES,
  ENQUIRY_TOPICS,
  toEnquiryPayload,
  validateEnquiry,
} from '../../../../lib/enquiry.js';

// Long enough for the paper plane to finish one flight even when the API answers at once.
const MIN_SEND_MS = 1100;
const FOCUS_ORDER = ['name', 'email', 'phone', 'fleetSize'];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function Field({ id, label, optional = false, error, children }) {
  return (
    <div className="cf-field">
      <label htmlFor={id} className="cf-label">
        {label}
        {optional ? <span className="cf-optional">Optional</span> : null}
      </label>
      {children}
      {error ? (
        <span id={`${id}-error`} className="cf-error">
          {error}
        </span>
      ) : null}
    </div>
  );
}

export default function ContactForm() {
  const baseId = useId();
  const cardRef = useRef(null);
  const [values, setValues] = useState(EMPTY_ENQUIRY);
  const [errors, setErrors] = useState({});
  const [attempted, setAttempted] = useState(false);
  const [phase, setPhase] = useState('idle'); // idle | sending | sent
  const [sendError, setSendError] = useState('');
  const [sent, setSent] = useState(null);
  // The card keeps the form's height when it flips to the thank-you state, so the page doesn't jump.
  const [lockedHeight, setLockedHeight] = useState(null);

  const fieldId = (name) => `${baseId}-${name}`;

  const change = (next) => {
    setValues(next);
    // Re-check as they type only after a failed send, so errors clear the moment they're fixed.
    if (attempted) setErrors(validateEnquiry(next));
  };

  const inputProps = (name) => ({
    id: fieldId(name),
    name,
    value: values[name],
    onChange: (e) => change({ ...values, [name]: e.target.value }),
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `${fieldId(name)}-error` : undefined,
    className: 'cf-input',
  });

  const toggleTopic = (topic) =>
    change({
      ...values,
      topics: values.topics.includes(topic)
        ? values.topics.filter((t) => t !== topic)
        : [...values.topics, topic],
    });

  const onSubmit = async (event) => {
    event.preventDefault();
    if (phase !== 'idle') return;

    const found = validateEnquiry(values);
    setAttempted(true);
    setErrors(found);
    const firstInvalid = FOCUS_ORDER.find((name) => found[name]);
    if (firstInvalid) {
      document.getElementById(fieldId(firstInvalid))?.focus();
      return;
    }

    const payload = toEnquiryPayload(values);
    setSendError('');
    setPhase('sending');
    try {
      await Promise.all([sendEnquiry(payload), wait(MIN_SEND_MS)]);
      setLockedHeight(cardRef.current?.offsetHeight ?? null);
      setSent({ firstName: payload.name.split(/\s+/)[0], replyTo: payload.email || payload.phone });
      setPhase('sent');
    } catch (error) {
      setPhase('idle');
      setSendError(
        error?.status
          ? error.displayMessage
          : 'We could not reach our server. Check your connection and try again.',
      );
    }
  };

  const sendAnother = () => {
    setValues(EMPTY_ENQUIRY);
    setErrors({});
    setAttempted(false);
    setSent(null);
    setLockedHeight(null);
    setPhase('idle');
  };

  return (
    <section
      id="contact-form"
      data-screen-label="Contact form"
      style={{ background: '#FFFFFF', padding: '96px 40px 112px' }}
    >
      <div
        data-mcol
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1.25fr .85fr',
          gap: '72px',
          alignItems: 'start',
        }}
      >
        <div data-reveal>
          <div
            ref={cardRef}
            className="cf-card"
            style={lockedHeight ? { minHeight: `${lockedHeight}px` } : undefined}
          >
            {phase === 'sent' ? (
              <div className="cf-sent" role="status">
                <div className="cf-sent-badge" aria-hidden="true">
                  <svg viewBox="0 0 52 52">
                    <circle className="cf-sent-ring" cx="26" cy="26" r="24" />
                    <path className="cf-sent-tick" d="M15 27l7 7 15-16" />
                  </svg>
                </div>
                <div className="cf-title">Enquiry sent</div>
                <p className="cf-sent-text">
                  Thanks, {sent.firstName}. We&apos;ll reply on <strong>{sent.replyTo}</strong>{' '}
                  within one working day, usually the same afternoon.
                </p>
                <button type="button" className="cf-again" onClick={sendAnother}>
                  Send another enquiry
                </button>
              </div>
            ) : (
              <form noValidate onSubmit={onSubmit} aria-busy={phase === 'sending'}>
                <div className="cf-title">Send us the details</div>
                <div className="cf-intro">
                  We reply within one working day, usually the same afternoon.
                </div>

                <div data-mcol2 className="cf-grid">
                  <Field id={fieldId('name')} label="Your name" error={errors.name}>
                    <input
                      {...inputProps('name')}
                      type="text"
                      placeholder="Full name"
                      autoComplete="name"
                    />
                  </Field>
                  <Field id={fieldId('company')} label="Company" optional>
                    <input
                      {...inputProps('company')}
                      type="text"
                      placeholder="Registered business name"
                      autoComplete="organization"
                    />
                  </Field>
                  <Field id={fieldId('email')} label="Work email" error={errors.email}>
                    <input
                      {...inputProps('email')}
                      type="email"
                      placeholder="you@company.com"
                      autoComplete="email"
                    />
                  </Field>
                  <Field id={fieldId('phone')} label="Phone" error={errors.phone}>
                    <input
                      {...inputProps('phone')}
                      type="tel"
                      placeholder="+91 98765 43210"
                      autoComplete="tel"
                    />
                  </Field>
                  <Field id={fieldId('fleetSize')} label="Fleet size" error={errors.fleetSize}>
                    <select {...inputProps('fleetSize')} className="cf-input cf-select">
                      <option value="" disabled>
                        Select fleet size
                      </option>
                      {ENQUIRY_FLEET_SIZES.map((size) => (
                        <option key={size.value} value={size.value}>
                          {size.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field id={fieldId('region')} label="Where you operate" optional>
                    <input {...inputProps('region')} type="text" placeholder="City or states" />
                  </Field>
                </div>

                <div className="cf-topics" role="group" aria-labelledby={fieldId('topics')}>
                  <div id={fieldId('topics')} className="cf-label">
                    What do you want to talk about
                    <span className="cf-optional">Pick any</span>
                  </div>
                  <div className="cf-chips">
                    {ENQUIRY_TOPICS.map((topic) => {
                      const on = values.topics.includes(topic.value);
                      return (
                        <button
                          key={topic.value}
                          type="button"
                          className="cf-chip"
                          aria-pressed={on}
                          onClick={() => toggleTopic(topic.value)}
                        >
                          {on ? <Check size={14} strokeWidth={2.5} aria-hidden="true" /> : null}
                          {topic.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="cf-message">
                  <Field id={fieldId('message')} label="Anything we should know" optional>
                    <textarea
                      {...inputProps('message')}
                      rows="4"
                      maxLength={3000}
                      placeholder="What you run today, what is breaking, what you want to fix first"
                    />
                  </Field>
                </div>

                {/* Honeypot: hidden from people, filled in by bots, dropped by the server. */}
                <div className="cf-trap" aria-hidden="true">
                  <label htmlFor={fieldId('website')}>Website</label>
                  <input
                    id={fieldId('website')}
                    name="website"
                    type="text"
                    aria-label="Website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={values.website}
                    onChange={(e) => setValues({ ...values, website: e.target.value })}
                  />
                </div>

                <div className="cf-actions">
                  <button
                    type="submit"
                    className="cf-send"
                    data-phase={phase}
                    disabled={phase === 'sending'}
                  >
                    <span>{phase === 'sending' ? 'Sending…' : 'Send enquiry'}</span>
                    <span className="cf-send-plane" aria-hidden="true">
                      <Send size={17} />
                    </span>
                  </button>
                  <span className="cf-privacy">
                    We use these details only to reply to you. Nothing is shared outside GNB Edge.
                  </span>
                </div>

                {sendError ? (
                  <p className="cf-send-error" role="alert">
                    {sendError} You can also write to{' '}
                    <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
                  </p>
                ) : null}
              </form>
            )}
          </div>
        </div>
        <ContactChannels />
      </div>
    </section>
  );
}
