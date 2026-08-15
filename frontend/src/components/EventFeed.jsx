import React from 'react';

const EVENT_LABELS = {
  bounty_posted: 'Bounty posted',
  submission_made: 'Submission made',
  bounty_paid: 'Bounty paid out',
  bounty_cancelled: 'Bounty cancelled',
};

export default function EventFeed({ events, connected, error }) {
  return (
    <div className="index-card p-5 sm:p-6 h-full flex flex-col" style={{ transform: 'rotate(0.5deg)' }}>
      <span className="pin-dot bg-pin-pink border-2 border-corkdark" />
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg text-ink">Board activity</h3>
        <span className="flex items-center gap-1.5 text-xs font-mono text-muted">
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-pin-green animate-pulse' : 'bg-ink/20'}`} />
          {connected ? 'live' : 'connecting'}
        </span>
      </div>

      {error && <p className="text-xs text-pin-pink mb-3 font-mono">{error}</p>}

      {events.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-muted text-center max-w-[22ch]">
            New bounties, submissions, and payouts will appear here as they happen on-chain.
          </p>
        </div>
      ) : (
        <ul className="space-y-3 overflow-y-auto max-h-[380px] pr-1">
          {events.map((e, idx) => (
            <li key={e.id || idx} className="text-xs border-l-2 border-pin-yellow pl-3 py-0.5">
              <p className="text-ink font-medium">{EVENT_LABELS[e.topic?.[0]] || 'Contract event'}</p>
              <p className="text-muted font-mono mt-0.5">ledger #{e.ledger}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
