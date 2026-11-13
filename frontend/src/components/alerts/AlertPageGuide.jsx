import { Link } from 'react-router-dom';
import { createElement } from 'react';
import { ClipboardCheck, FileText, ChartNoAxesCombined, Radio, ChevronDown } from 'lucide-react';
import './AlertPageGuide.css';

const PAGES = [
  {
    key: 'inbox',
    to: '/alert-inbox',
    name: 'Alert inbox',
    icon: ClipboardCheck,
    text: 'Start here. Related reports for one issue are grouped into one review item.',
  },
  {
    key: 'owner',
    to: '/owner-alerts',
    name: 'Owner alerts',
    icon: FileText,
    text: 'Individual alerts from fleet checks and vehicle providers. Several records may relate to one issue.',
  },
  {
    key: 'intelligence',
    to: '/intelligence',
    name: 'Intelligence',
    icon: ChartNoAxesCombined,
    text: 'Patterns, totals and explanations for the date range you choose. Use it to understand fuel use, stops and driving.',
  },
  {
    key: 'events',
    to: '/fleet-alerts',
    name: 'Vehicle event history',
    icon: Radio,
    text: 'Events sent by FleetEdge, including routine refuelling and crossings. An event does not always need action.',
  },
];
const COPY = {
  inbox: {
    title: 'Start here to review fleet issues',
    text: 'Each item tells you what to check and groups related reports. Open means it has not been marked reviewed; check the report dates and evidence to see whether the issue still applies.',
  },
  owner: {
    title: 'The individual records behind fleet alerts',
    text: 'These are alerts raised by fleet checks and vehicle providers. The same issue can have several records. Use Alert inbox for grouped issues; use this page to inspect the original messages and dates.',
  },
  intelligence: {
    title: 'Understand how your fleet is performing',
    text: 'Choose a date range, then open a topic to see fuel use, stops, driving and the evidence behind each finding. Use Alert inbox when you want a list of issues to follow up.',
  },
  events: {
    title: 'Events reported by the vehicle provider',
    text: 'Refuelling, crossings and other routine events appear alongside warnings here. Check the event type, time and vehicle. Use Alert inbox for issues that need a follow-up.',
  },
};

export default function AlertPageGuide({ page = 'inbox' }) {
  const copy = COPY[page];
  return (
    <section className="alert-page-guide" aria-label="How to use this page">
      <div className="alert-page-guide-intro">
        <ClipboardCheck size={19} aria-hidden="true" />
        <div>
          <h2>{copy.title}</h2>
          <p>{copy.text}</p>
        </div>
      </div>
      {page === 'inbox' ? (
        <ol className="alert-page-guide-steps">
          <li>
            <span>1</span>
            <div>
              <strong>Read the details</strong>
              <p>Check when it was reported and what the evidence actually shows.</p>
            </div>
          </li>
          <li>
            <span>2</span>
            <div>
              <strong>Check the reports</strong>
              <p>Read the reports in the details panel and check with the driver or your team.</p>
            </div>
          </li>
          <li>
            <span>3</span>
            <div>
              <strong>Mark as reviewed</strong>
              <p>
                This records that you have checked it. It does not fix the issue or confirm a loss.
              </p>
            </div>
          </li>
        </ol>
      ) : null}
      <details className="alert-page-guide-pages">
        <summary>
          Alert inbox, Owner alerts and Intelligence: which should I use?
          <ChevronDown size={15} aria-hidden="true" />
        </summary>
        <div className="alert-page-guide-links">
          {PAGES.map(({ key, to, name, text, icon }) => (
            <Link key={key} to={to} aria-current={page === key ? 'page' : undefined}>
              {createElement(icon, { size: 17, 'aria-hidden': true })}
              <div>
                <strong>
                  {name}
                  {page === key ? ' · You are here' : ''}
                </strong>
                <p>{text}</p>
              </div>
            </Link>
          ))}
        </div>
      </details>
    </section>
  );
}
