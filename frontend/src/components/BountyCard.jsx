import React, { useState } from 'react';

const STATUS_PIN = {
  Open: 'bg-pin-green',
  InReview: 'bg-pin-yellow',
  Paid: 'bg-pin-blue',
  Cancelled: 'bg-pin-pink',
};

const STATUS_LABEL = {
  Open: 'Open',
  InReview: 'In review',
  Paid: 'Paid out',
  Cancelled: 'Cancelled',
};

/**
 * The signature UI element: a bounty rendered as a pinned index card, tilted
 * slightly, with a colored pushpin indicating status — the whole point of a
 * community bounty board is that it should look like a literal corkboard of
 * requests, not a generic ticket list.
 */
export default function BountyCard({ bounty, currentAddress, onAction, actionLoading, tilt = 0 }) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');

  if (!bounty) {
    return (
      <div className="index-card p-8 text-center max-w-md mx-auto">
        <p className="text-muted text-sm">No bounty loaded. Post one or paste a Bounty ID to inspect.</p>
      </div>
    );
  }

  const posterAddr = String(bounty.poster);
  const currentStatus = String(bounty.status);
  
  const isPoster = currentAddress === posterAddr;
  const alreadySubmitted = bounty.submissions?.some((s) => String(s.contributor) === currentAddress);
  const canSubmit = currentStatus === 'Open' || currentStatus === 'InReview';

  return (
    <div className="index-card p-5 sm:p-6 max-w-md mx-auto" style={{ transform: `rotate(${tilt}deg)` }}>
      <span className={`pin-dot ${STATUS_PIN[currentStatus] || STATUS_PIN.Open} border-2 border-corkdark`} />

      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-display text-xl text-ink leading-snug">{bounty.title}</h3>
        <span className="pill border-ink/20 text-ink/60 shrink-0">{STATUS_LABEL[currentStatus] || currentStatus}</span>
      </div>

      <p className="text-sm text-ink/70 leading-relaxed">{bounty.description}</p>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-dashed border-cardline">
        <span className="font-mono text-lg text-ink">
          {Number(bounty.reward_amount).toLocaleString()} <span className="text-xs text-muted">tokens</span>
        </span>
        <span className="text-xs text-muted font-mono">
          {bounty.submissions?.length || 0} submission{(bounty.submissions?.length || 0) !== 1 ? 's' : ''}
        </span>
      </div>

      {bounty.submissions?.length > 0 && (
        <div className="mt-4 space-y-2">
          {bounty.submissions.map((s, i) => (
            <div key={i} className="text-xs bg-card border border-cardline rounded px-3 py-2">
              <p className="font-mono text-ink/50 truncate">{String(s.contributor)}</p>
              <p className="text-ink/80 mt-0.5">{s.note}</p>
              {isPoster && currentStatus === 'InReview' && (
                <button
                  className="btn-primary text-xs py-1.5 px-3 mt-2"
                  disabled={actionLoading}
                  onClick={() => onAction('approve', String(s.contributor))}
                >
                  Approve &amp; pay out
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {!isPoster && canSubmit && !alreadySubmitted && !noteOpen && (
          <button className="btn-secondary text-xs py-2" onClick={() => setNoteOpen(true)}>
            Submit work
          </button>
        )}
        {noteOpen && (
          <div className="w-full space-y-2">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Link your PR or describe what you did…"
              rows={2}
              className="w-full bg-card border border-cardline rounded px-3 py-2 text-xs text-ink focus:border-ink/40 outline-none"
            />
            <button
              className="btn-primary text-xs py-2"
              disabled={actionLoading || !note}
              onClick={() => {
                onAction('submit', note);
                setNoteOpen(false);
                setNote('');
              }}
            >
              {actionLoading ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        )}
        {isPoster && currentStatus === 'Open' && (
          <button
            className="btn-secondary text-xs py-2 !border-pin-pink/40 !text-pin-pink"
            disabled={actionLoading}
            onClick={() => onAction('cancel')}
          >
            Cancel &amp; reclaim funds
          </button>
        )}
      </div>
    </div>
  );
}
