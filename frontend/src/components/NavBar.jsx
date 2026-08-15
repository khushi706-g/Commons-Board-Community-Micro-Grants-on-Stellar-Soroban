import React from 'react';

function truncate(address) {
  if (!address) return '';
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export default function NavBar({ wallet, view, onViewChange }) {
  const tabs = [
    { id: 'board', label: 'The board' },
    { id: 'post', label: 'Post a bounty' },
    { id: 'profile', label: 'Contributors' },
  ];
  return (
    <header className="sticky top-0 z-30 bg-cork/95 backdrop-blur border-b-2 border-corkdark">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-pin-yellow border-2 border-corkdark flex items-center justify-center shadow-pinned">
            <span className="font-display text-ink text-sm">C</span>
          </div>
          <span className="font-display text-xl text-card tracking-wide">Commons Board</span>
          <span className="hidden sm:inline text-[10px] font-mono text-card/60 border border-card/30 rounded px-1.5 py-0.5 ml-1 uppercase">
            testnet
          </span>
        </div>

        <nav className="hidden sm:flex items-center gap-1">
          {tabs.map((v) => (
            <button
              key={v.id}
              onClick={() => onViewChange(v.id)}
              className={`text-sm px-3 py-1.5 rounded-card transition-colors font-display ${
                view === v.id ? 'bg-card text-ink' : 'text-card/70 hover:text-card'
              }`}
            >
              {v.label}
            </button>
          ))}
        </nav>

        {wallet.isConnected ? (
          <button onClick={wallet.disconnect} className="btn-secondary text-sm font-mono !text-card !border-card/40">
            {truncate(wallet.address)}
          </button>
        ) : (
          <button onClick={wallet.connect} disabled={wallet.connecting} className="btn-primary text-sm">
            {wallet.connecting ? 'Connecting…' : 'Connect wallet'}
          </button>
        )}
      </div>

      <div className="sm:hidden flex border-t border-corkdark">
        {tabs.map((v) => (
          <button
            key={v.id}
            onClick={() => onViewChange(v.id)}
            className={`flex-1 text-xs py-2.5 font-display ${view === v.id ? 'text-pin-yellow border-b-2 border-pin-yellow' : 'text-card/50'}`}
          >
            {v.label}
          </button>
        ))}
      </div>
    </header>
  );
}
