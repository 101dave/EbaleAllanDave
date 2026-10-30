import React from 'react';
import { Icon } from './Icons.jsx';

function NowItem({ icon, label, entry, fallback }) {
  return (
    <div className="now-item">
      <div className="now-item-icon" aria-hidden="true">{icon === 'building' ? <span className="now-live-dot" /> : <Icon name={icon} size={16} />}</div>
      <div>
        <p className="now-item-label">{label}</p>
        {entry ? (
          <>
            <p className="now-item-text">{entry.href ? <a href={entry.href} target="_blank" rel="noopener noreferrer">{entry.text}</a> : entry.text}</p>
            {entry.detail && <p className="now-item-detail">{entry.detail}</p>}
          </>
        ) : <p className="now-item-detail now-unset">{fallback}</p>}
      </div>
    </div>
  );
}

// A dated, honest snapshot: an empty field stays explicitly empty until supplied.
export function NowCard({ data }) {
  return (
    <aside className="now-card tw-relative tw-overflow-hidden tw-rounded-2xl" aria-labelledby="now-heading">
      <div className="now-card-top">
        <div><p className="now-overline">A LITTLE CONTEXT</p><h2 id="now-heading">Now<span className="now-period">.</span></h2></div>
        <span className="now-chip"><span className="now-live-dot" aria-hidden="true" /> NOTES</span>
      </div>
      <p className="now-intro">A snapshot of what’s on my desk.</p>
      <div className="now-items">
        <NowItem icon="building" label="BUILDING" entry={data.building} fallback="No update shared yet." />
        <NowItem icon="book" label="READING" entry={data.reading} fallback="No title shared yet." />
        <NowItem icon="terminal" label="EXPLORING" entry={data.exploring} fallback="No update shared yet." />
      </div>
      <div className="now-footer"><span>LATEST VERIFIED UPDATE</span><time dateTime={data.asOf}>{data.asOfLabel}</time></div>
    </aside>
  );
}
