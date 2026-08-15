import React from 'react';

export default function Banner({ type = 'error', message, onDismiss }) {
  if (!message) return null;
  const styles = type === 'error'
    ? 'border-pin-pink/50 bg-card text-pin-pink'
    : 'border-pin-green/50 bg-card text-pin-green';

  return (
    <div className={`border-2 rounded-card px-4 py-3 text-sm flex items-start justify-between gap-3 max-w-md mx-auto ${styles}`}>
      <span className="leading-relaxed">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="shrink-0 opacity-70 hover:opacity-100" aria-label="Dismiss">
          ×
        </button>
      )}
    </div>
  );
}
