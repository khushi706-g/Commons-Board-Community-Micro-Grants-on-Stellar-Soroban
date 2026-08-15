import React, { useState } from 'react';

export default function BountyLookup({ onLookup, loading }) {
  const [bountyId, setBountyId] = useState('');

  return (
    <div className="index-card p-5 sm:p-6 max-w-md mx-auto" style={{ transform: 'rotate(1deg)' }}>
      <span className="pin-dot bg-pin-blue border-2 border-corkdark" />
      <h3 className="font-display text-xl text-ink mb-3">Find a bounty</h3>
      <div className="flex gap-2">
        <input
          value={bountyId}
          onChange={(e) => setBountyId(e.target.value)}
          placeholder="Bounty ID (e.g. 0)"
          className="flex-1 bg-card border border-cardline rounded px-3 py-2 text-sm font-mono text-ink focus:border-ink/40 outline-none"
        />
        <button onClick={() => onLookup(bountyId)} disabled={loading || bountyId === ''} className="btn-secondary text-sm">
          {loading ? 'Loading…' : 'Pull card'}
        </button>
      </div>
    </div>
  );
}
