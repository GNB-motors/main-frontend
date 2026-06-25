import React, { useState } from 'react';
import { Palette, Mails } from 'lucide-react';
import BrandingTab from './BrandingTab';
import TemplatesTab from './TemplatesTab';

const TABS = [
  { key: 'branding', label: 'Branding', Icon: Palette },
  { key: 'templates', label: 'Templates', Icon: Mails },
];

export default function CommunicationPage() {
  const [tab, setTab] = useState('branding');

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-800">Communication</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Configure email branding and reusable templates. Sending arrives in a later phase.
        </p>
      </div>

      <div className="mb-6 flex w-fit gap-1 rounded-xl bg-slate-100 p-1">
        {TABS.map((t) => {
          const TabIcon = t.Icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
                tab === t.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <TabIcon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'branding' ? <BrandingTab /> : <TemplatesTab />}
    </div>
  );
}
