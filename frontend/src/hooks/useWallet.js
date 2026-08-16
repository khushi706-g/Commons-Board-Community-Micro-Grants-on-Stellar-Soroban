import { useCallback, useEffect, useState } from 'react';
import { StellarWalletsKit, WalletNetwork, allowAllModules } from '@creit.tech/stellar-wallets-kit';
import { Horizon } from '@stellar/stellar-sdk';
import { NETWORK } from '../contracts/config';

let kitInstance = null;
function getKit() {
  if (!kitInstance) {
    kitInstance = new StellarWalletsKit({ network: WalletNetwork.TESTNET, selectedWalletId: undefined, modules: allowAllModules() });
  }
  return kitInstance;
}

const server = new Horizon.Server('https://horizon-testnet.stellar.org');

export function useWallet() {
  const [address, setAddress] = useState(null);
  const [balance, setBalance] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Removed auto-restore from localStorage to ensure users explicitly connect their wallet.
  // This prevents Freighter from interrupting the first transaction with a "Share public key" prompt.

  const fetchBalance = useCallback(async (addr) => {
    if (!addr) return;
    try {
      const account = await server.loadAccount(addr);
      const native = account.balances.find((b) => b.asset_type === 'native');
      if (native) {
        setBalance(parseFloat(native.balance).toFixed(2));
      }
    } catch (err) {
      console.error("Could not fetch balance:", err);
    }
  }, []);

  // Poll balance
  useEffect(() => {
    if (!address) return;
    fetchBalance(address);
    const interval = setInterval(() => fetchBalance(address), 10000); // 10s poll
    return () => clearInterval(interval);
  }, [address, fetchBalance]);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const kit = getKit();
      await kit.openModal({
        onWalletSelected: async (option) => {
          kit.setWallet(option.id);
          const { address: addr } = await kit.getAddress();
          setAddress(addr);
          localStorage.setItem('commonsboard:lastAddress', addr);
          await fetchBalance(addr);
        },
      });
    } catch (err) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  }, [fetchBalance]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setBalance(null);
    localStorage.removeItem('commonsboard:lastAddress');
  }, []);

  const signTransaction = useCallback(async (xdr) => {
    const kit = getKit();
    const { signedTxXdr } = await kit.signTransaction(xdr, { networkPassphrase: NETWORK.networkPassphrase, address });
    return signedTxXdr;
  }, [address]);

  return { address, balance, connecting, error, connect, disconnect, signTransaction, isConnected: !!address };
}
