import React, { useState, useEffect } from 'react';
import NavBar from './components/NavBar';
import Hero from './components/Hero';
import PostBountyForm from './components/PostBountyForm';
import BountyLookup from './components/BountyLookup';
import BountyCard from './components/BountyCard';
import ContributorCard from './components/ContributorCard';
import EventFeed from './components/EventFeed';
import Banner from './components/Banner';
import Skeleton from './components/Skeleton';
import { useWallet } from './hooks/useWallet';
import { useContractEvents } from './hooks/useContractEvents';
import { boardClient, contributorClient } from './contracts/boardClient';
import { CONTRACTS } from './contracts/config';

export default function App() {
  const wallet = useWallet();
  const { events, connected, error: eventError } = useContractEvents();

  const [view, setView] = useState('board');
  const [bounty, setBounty] = useState(null);
  const [currentBountyId, setCurrentBountyId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [allBounties, setAllBounties] = useState([]);
  const [loadingAllBounties, setLoadingAllBounties] = useState(false);
  const [loadingBounty, setLoadingBounty] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  async function handleLookup(bountyId) {
    setError(null);
    setLoadingBounty(true);
    try {
      const result = await boardClient.getBounty(bountyId, wallet.address);
      setBounty({ id: bountyId, ...result });
      setCurrentBountyId(bountyId);
    } catch (err) {
      setError(`Could not load bounty #${bountyId}. It may not exist, or contract IDs in config.js need updating. (${err.message})`);
      setBounty(null);
    } finally {
      setLoadingBounty(false);
    }
  }

  useEffect(() => {
    if (view === 'board' && wallet.isConnected) {
      loadAllBounties();
    }
  }, [view, wallet.isConnected]);

  async function loadAllBounties() {
    setLoadingAllBounties(true);
    try {
      let bounties = [];
      for (let i = 0; i < 20; i++) {
        try {
          const b = await boardClient.getBounty(i, wallet.address);
          bounties.push({ id: i, ...b });
        } catch (e) {
          break; // Stop at first missing bounty
        }
      }
      setAllBounties(bounties.reverse());
    } finally {
      setLoadingAllBounties(false);
    }
  }

  async function handlePost({ title, description, rewardAmount }) {
    if (!wallet.isConnected) {
      setError('Connect a wallet first to post a bounty.');
      return;
    }
    setError(null);
    setPosting(true);
    try {
      const { hash } = await boardClient.postBounty(
        wallet.address,
        title,
        description,
        CONTRACTS.REWARD_TOKEN_ID,
        rewardAmount,
        CONTRACTS.CONTRIBUTOR_CONTRACT_ID,
        wallet.signTransaction
      );
      setSuccess(
        <span>
          Bounty pinned and funded with <strong>{rewardAmount / 10000000} XLM</strong>. Transaction:{' '}
          <a href={`https://stellar.expert/explorer/testnet/tx/${hash}`} target="_blank" rel="noreferrer" className="underline hover:opacity-80">
            {hash.slice(0, 8)}…
          </a>
        </span>
      );
      setView('board');
    } catch (err) {
      setError(`Failed to post bounty: ${err.message}`);
    } finally {
      setPosting(false);
    }
  }

  async function handleAction(action, payload) {
    if (!wallet.isConnected || currentBountyId === null) {
      setError('Connect a wallet and load a bounty first.');
      return;
    }
    setError(null);
    setActionLoading(true);
    try {
      let result;
      if (action === 'submit') {
        result = await boardClient.submitWork(currentBountyId, wallet.address, payload, wallet.signTransaction);
      } else if (action === 'approve') {
        result = await boardClient.approveSubmission(currentBountyId, payload, wallet.address, wallet.signTransaction);
      } else if (action === 'cancel') {
        result = await boardClient.cancelBounty(currentBountyId, wallet.address, wallet.signTransaction);
      }
      setSuccess(
        <span>
          Action confirmed on-chain. Transaction:{' '}
          <a href={`https://stellar.expert/explorer/testnet/tx/${result.hash}`} target="_blank" rel="noreferrer" className="underline hover:opacity-80">
            {result.hash.slice(0, 8)}…
          </a>
        </span>
      );
      await handleLookup(currentBountyId);
    } catch (err) {
      setError(`Action failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleLookupProfile(address) {
    setError(null);
    setLoadingProfile(true);
    try {
      const result = await contributorClient.getProfile(address, wallet.address || address);
      setProfile(result);
    } catch (err) {
      setError(`Could not load contributor record. (${err.message})`);
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  }

  return (
    <div className="min-h-screen">
      <NavBar wallet={wallet} view={view} onViewChange={setView} />
      {view === 'board' && <Hero />}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 space-y-6">
        {(error || wallet.error) && <Banner type="error" message={error || wallet.error} onDismiss={() => setError(null)} />}
        {success && <Banner type="success" message={success} onDismiss={() => setSuccess(null)} />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {view === 'board' && (
              <>
                <BountyLookup onLookup={handleLookup} loading={loadingBounty} />
                
                {loadingBounty ? (
                  <Skeleton />
                ) : (
                  bounty && (
                    <BountyCard
                      bounty={bounty}
                      currentAddress={wallet.address}
                      onAction={handleAction}
                      actionLoading={actionLoading}
                      tilt={-1.5}
                    />
                  )
                )}

                {!bounty && wallet.isConnected && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-hand font-bold border-b-2 border-corkdark/10 pb-2">Recent Bounties</h3>
                    {loadingAllBounties ? (
                      <Skeleton />
                    ) : allBounties.length > 0 ? (
                      allBounties.map(b => (
                        <div key={b.id} onClick={() => handleLookup(b.id)} className="cursor-pointer transition-transform hover:-translate-y-1">
                          <BountyCard
                            bounty={b}
                            currentAddress={wallet.address}
                            onAction={handleAction}
                            actionLoading={actionLoading}
                            tilt={0}
                          />
                        </div>
                      ))
                    ) : (
                      <p className="text-card/50 italic font-mono">No bounties found.</p>
                    )}
                  </div>
                )}
                {!bounty && !wallet.isConnected && (
                  <p className="text-card/50 text-center italic mt-8 font-mono">Connect your wallet to browse active bounties.</p>
                )}
              </>
            )}

            {view === 'post' && <PostBountyForm onPost={handlePost} loading={posting} />}

            {view === 'profile' && (
              <ContributorCard onLookup={handleLookupProfile} profile={profile} loading={loadingProfile} />
            )}
          </div>

          <div className="lg:col-span-1">
            <EventFeed events={events} connected={connected} error={eventError} />
          </div>
        </div>
      </main>

      <footer className="border-t-2 border-corkdark py-8 text-center">
        <p className="text-xs text-card/40 font-mono">
          Commons Board · Soroban Testnet · Board {CONTRACTS.BOARD_CONTRACT_ID.slice(0, 6)}…{CONTRACTS.BOARD_CONTRACT_ID.slice(-4)}
        </p>
      </footer>
    </div>
  );
}
