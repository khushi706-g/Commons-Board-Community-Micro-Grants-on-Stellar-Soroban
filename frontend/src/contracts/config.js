export const NETWORK = {
  network: 'TESTNET',
  networkPassphrase: 'Test SDF Network ; September 2015',
  rpcUrl: 'https://soroban-testnet.stellar.org',
  horizonUrl: 'https://horizon-testnet.stellar.org',
};

export const CONTRACTS = {
  BOARD_CONTRACT_ID: import.meta.env.VITE_BOARD_CONTRACT_ID || 'CA...REPLACE_AFTER_DEPLOY',
  CONTRIBUTOR_CONTRACT_ID: import.meta.env.VITE_CONTRIBUTOR_CONTRACT_ID || 'CA...REPLACE_AFTER_DEPLOY',
  REWARD_TOKEN_ID: import.meta.env.VITE_REWARD_TOKEN_ID || 'CA...REPLACE_AFTER_DEPLOY',
};
