import React, { useState } from 'react';

export default function PostBountyForm({ onPost, loading }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rewardAmount, setRewardAmount] = useState('');

  const canSubmit = title && description && rewardAmount;

  return (
    <form
      className="index-card p-5 sm:p-6 space-y-4 max-w-md mx-auto"
      style={{ transform: 'rotate(-1deg)' }}
      onSubmit={(e) => {
        e.preventDefault();
        onPost({ title, description, rewardAmount: Number(rewardAmount) });
      }}
    >
      <span className="pin-dot bg-pin-yellow border-2 border-corkdark" />
      <h3 className="font-display text-xl text-ink">Pin a new bounty</h3>

      <div>
        <label className="block text-xs text-muted mb-1.5">What needs doing?</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Fix onboarding docs typo"
          className="w-full bg-card border border-cardline rounded px-3 py-2 text-sm text-ink focus:border-ink/40 outline-none"
        />
      </div>

      <div>
        <label className="block text-xs text-muted mb-1.5">Details</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="The setup guide references an outdated CLI flag…"
          className="w-full bg-card border border-cardline rounded px-3 py-2 text-sm text-ink focus:border-ink/40 outline-none"
        />
      </div>

      <div>
        <label className="block text-xs text-muted mb-1.5">Reward (deposited now)</label>
        <input
          value={rewardAmount}
          onChange={(e) => setRewardAmount(e.target.value)}
          type="number"
          min="0"
          placeholder="50"
          className="w-full bg-card border border-cardline rounded px-3 py-2 text-sm font-mono text-ink focus:border-ink/40 outline-none"
        />
      </div>

      <button type="submit" disabled={!canSubmit || loading} className="btn-primary text-sm w-full">
        {loading ? 'Pinning & depositing…' : 'Pin to the board'}
      </button>
    </form>
  );
}
