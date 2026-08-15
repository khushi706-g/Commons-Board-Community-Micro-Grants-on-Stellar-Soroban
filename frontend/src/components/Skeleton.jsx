import React from 'react';

export default function Skeleton() {
  return (
    <div className="index-card p-6 space-y-4 animate-pulse max-w-md mx-auto" role="status" aria-label="Loading bounty data">
      <div className="h-4 w-32 bg-cardline rounded" />
      <div className="h-6 w-48 bg-cardline rounded" />
      <div className="h-16 bg-cardline/60 rounded" />
    </div>
  );
}
