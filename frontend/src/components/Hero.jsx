import React from 'react';

export default function Hero() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-8">
      <div className="max-w-2xl">
        <span className="pill border-card/40 text-card bg-card/10">Soroban · Testnet</span>
        <h1 className="font-display text-4xl sm:text-6xl mt-4 leading-[1.05] text-card">
          Small jobs. Real pay.
          <span className="block text-pin-yellow">Public record.</span>
        </h1>
        <p className="text-card/70 mt-4 text-base sm:text-lg leading-relaxed font-body">
          Anyone can pin a funded bounty to the board. Anyone can pick it up. When it&apos;s done,
          the reward pays out and it becomes part of your public, on-chain contributor record.
        </p>
      </div>
    </section>
  );
}
