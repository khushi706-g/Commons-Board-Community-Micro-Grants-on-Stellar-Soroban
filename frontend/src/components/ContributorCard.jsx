import React, { useState } from 'react';

export default function ContributorCard({ onLookup, profile, loading }) {
  const [address, setAddress] = useState('');

  return (
    <div className="index-card p-5 sm:p-6 max-w-md mx-auto space-y-4" style={{ transform: 'rotate(-0.5deg)' }}>
      <span className="pin-dot bg-pin-green border-2 border-corkdark" />
      <h3 className="font-display text-xl text-ink">Contributor record</h3>
      <div className="flex gap-2">
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="G... address"
          className="flex-1 bg-card border border-cardline rounded px-3 py-2 text-sm font-mono text-ink focus:border-ink/40 outline-none"
        />
        <button onClick={() => onLookup(address)} disabled={loading || !address} className="btn-secondary text-sm">
          {loading ? 'Loading…' : 'Look up'}
        </button>
      </div>

      {profile && (
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-dashed border-cardline text-center">
          <div>
            <p className="text-2xl font-display text-pin-yellow">{profile.score}</p>
            <p className="text-xs text-muted mt-1">Score</p>
          </div>
          <div>
            <p className="text-2xl font-display text-pin-green">{profile.bounties_completed}</p>
            <p className="text-xs text-muted mt-1">Completed</p>
          </div>
          <div>
            <p className="text-2xl font-display text-pin-blue">{(Number(profile.total_earned) / 10000000).toLocaleString()}</p>
            <p className="text-xs text-muted mt-1">Earned</p>
          </div>
        </div>
      )}
    </div>
  );
}
