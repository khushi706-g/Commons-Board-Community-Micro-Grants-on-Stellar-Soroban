import React, { useState } from 'react';
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
      setBounty(result);
      setCurrentBountyId(bountyId);
    } catch (err) {
      setError(`Could not load bounty #${bountyId}. It may not exist, or contract IDs in config.js need updating. (${err.message})`);
      setBounty(null);
    } finally {
      setLoadingBounty(false);
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
      setSuccess(`Bounty pinned and funded. Transaction: ${hash}`);
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
      setSuccess(`Action confirmed on-chain. Transaction: ${result.hash}`);
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
                  <BountyCard
                    bounty={bounty}
                    currentAddress={wallet.address}
                    onAction={handleAction}
                    actionLoading={actionLoading}
                    tilt={-1.5}
                  />
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
