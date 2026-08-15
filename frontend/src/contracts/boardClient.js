import { Contract, rpc, TransactionBuilder, BASE_FEE, nativeToScVal, scValToNative } from '@stellar/stellar-sdk';
import { NETWORK, CONTRACTS } from './config';

const server = new rpc.Server(NETWORK.rpcUrl);

class BaseClient {
  constructor(contractId) {
    this.contract = new Contract(contractId);
  }

  async _buildAndSimulate(method, args, sourceAddress) {
    // Default active testnet address for unauthenticated view queries
    const fallback = 'GBX6KXN57LQL7KUVGBFHTV7C7EIT7G6MYD375L35R2J7AIVFDR2I2IYY';
    const account = await server.getAccount(sourceAddress || fallback);
    const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK.networkPassphrase })
      .addOperation(this.contract.call(method, ...args))
      .setTimeout(60)
      .build();
    const simulated = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(simulated)) throw new Error(`Simulation failed: ${simulated.error}`);
    return { tx, simulated };
  }

  async view(method, args = [], sourceAddress) {
    const { simulated } = await this._buildAndSimulate(method, args, sourceAddress);
    return simulated.result?.retval ? scValToNative(simulated.result.retval) : null;
  }

  async invoke(method, args, sourceAddress, signTransaction) {
    const { tx, simulated } = await this._buildAndSimulate(method, args, sourceAddress);
    const prepared = rpc.assembleTransaction(tx, simulated).build();
    const signedXdr = await signTransaction(prepared.toXDR());
    const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK.networkPassphrase);
    const sendResponse = await server.sendTransaction(signedTx);
    if (sendResponse.status === 'ERROR') throw new Error(`Transaction submission failed: ${JSON.stringify(sendResponse.errorResult)}`);
    return this._pollTransaction(sendResponse.hash);
  }

  async _pollTransaction(hash, attempts = 15) {
    for (let i = 0; i < attempts; i++) {
      const result = await server.getTransaction(hash);
      if (result.status === 'SUCCESS') return { hash, status: 'SUCCESS', result };
      if (result.status === 'FAILED') throw new Error(`Transaction failed: ${hash}`);
      await new Promise((r) => setTimeout(r, 1500));
    }
    throw new Error(`Transaction ${hash} did not confirm in time`);
  }
}

export class BoardClient extends BaseClient {
  constructor(contractId = CONTRACTS.BOARD_CONTRACT_ID) {
    super(contractId);
  }

  postBounty(poster, title, description, rewardToken, rewardAmount, contributorRegistry, signTransaction) {
    const args = [
      nativeToScVal(poster, { type: 'address' }),
      nativeToScVal(title, { type: 'string' }),
      nativeToScVal(description, { type: 'string' }),
      nativeToScVal(rewardToken, { type: 'address' }),
      nativeToScVal(BigInt(rewardAmount), { type: 'i128' }),
      nativeToScVal(contributorRegistry, { type: 'address' }),
    ];
    return this.invoke('post_bounty', args, poster, signTransaction);
  }

  submitWork(bountyId, contributor, note, signTransaction) {
    const args = [
      nativeToScVal(BigInt(bountyId), { type: 'u64' }),
      nativeToScVal(contributor, { type: 'address' }),
      nativeToScVal(note, { type: 'string' }),
    ];
    return this.invoke('submit_work', args, contributor, signTransaction);
  }

  approveSubmission(bountyId, winner, poster, signTransaction) {
    const args = [nativeToScVal(BigInt(bountyId), { type: 'u64' }), nativeToScVal(winner, { type: 'address' })];
    return this.invoke('approve_submission', args, poster, signTransaction);
  }

  cancelBounty(bountyId, poster, signTransaction) {
    const args = [nativeToScVal(BigInt(bountyId), { type: 'u64' })];
    return this.invoke('cancel_bounty', args, poster, signTransaction);
  }

  getBounty(bountyId, sourceAddress) {
    return this.view('get_bounty', [nativeToScVal(BigInt(bountyId), { type: 'u64' })], sourceAddress);
  }
}

export class ContributorClient extends BaseClient {
  constructor(contractId = CONTRACTS.CONTRIBUTOR_CONTRACT_ID) {
    super(contractId);
  }

  getProfile(contributor, sourceAddress) {
    return this.view('get_profile', [nativeToScVal(contributor, { type: 'address' })], sourceAddress);
  }
}

export const boardClient = new BoardClient();
export const contributorClient = new ContributorClient();
