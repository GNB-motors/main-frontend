import React from 'react';
import { BookOpen, Inbox, ServerCrash } from 'lucide-react';
import LemuChangeEntry from './LemuChangeEntry';

const LemuChangeFeed = ({ manifests, diffsByVersion, status, onLoadDiff, expandedVersions, onToggleVersion }) => {
  if (status === 'loading') {
    return (
      <div className="lemu-change-feed lemu-change-feed--loading">
        <div className="lemu-spinner" />
        <div className="lemu-change-feed__title">Reading manifest history…</div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="lemu-change-feed lemu-change-feed--error">
        <div className="lemu-change-feed__icon"><ServerCrash size={24} /></div>
        <div className="lemu-change-feed__title">/manifests failed — can't read the version history. The history exists; this is a fetch error.</div>
      </div>
    );
  }

  if (!manifests || manifests.length === 0) {
    return (
      <div className="lemu-change-feed lemu-change-feed--empty">
        <div className="lemu-change-feed__icon"><Inbox size={24} /></div>
        <div className="lemu-change-feed__title">No manifest history yet</div>
        <div>Deploy to write the first structural manifest.</div>
      </div>
    );
  }

  const isSingle = manifests.length === 1;

  return (
    <section className="lemu-change-feed">
      <div className="lemu-change-feed__header">
        <h2 className="lemu-section__title"><BookOpen size={16} /> Change feed</h2>
        <span className="lemu-meta">{manifests.length} version{manifests.length === 1 ? '' : 's'}</span>
      </div>

      {isSingle && (
        <div className="lemu-change-feed__day-one">
          One version so far — v{manifests[0].version}, established {new Date(manifests[0].createdAt).toLocaleDateString()}. The book begins at the next deploy.
        </div>
      )}

      <div className="lemu-change-feed__list">
        {manifests.map((manifest) => (
          <LemuChangeEntry
            key={manifest.version}
            version={manifest.version}
            diff={diffsByVersion?.[manifest.version]}
            meta={manifest}
            expanded={expandedVersions.has(manifest.version)}
            onToggle={onToggleVersion}
            onLoadDiff={onLoadDiff}
          />
        ))}
      </div>

      <footer className="lemu-change-feed__footer">
        Versions are never deleted; always current.
      </footer>
    </section>
  );
};

export default LemuChangeFeed;
