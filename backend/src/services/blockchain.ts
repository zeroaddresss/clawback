import { ethers } from "ethers";
import { EventEmitter } from "events";
import { config } from "../config";
import { ESCROW_ABI, ERC20_ABI } from "../abi";
import { EscrowData, EscrowEvent, EscrowState } from "../types";

const STATE_NAMES: Record<number, string> = {
  [EscrowState.Active]: "Active",
  [EscrowState.Released]: "Released",
  [EscrowState.Disputed]: "Disputed",
  [EscrowState.Refunded]: "Refunded",
  [EscrowState.Expired]: "Expired",
};

export const eventBus = new EventEmitter();

let provider: ethers.JsonRpcProvider;
let wallet: ethers.Wallet | undefined;
let escrowContract: ethers.Contract;
let usdcContract: ethers.Contract;

export function initBlockchain() {
  if (!config.rpcUrl) {
    throw new Error("RPC_URL is not configured");
  }
  if (!config.contractAddress) {
    throw new Error("CONTRACT_ADDRESS is not configured");
  }
  if (!config.usdcAddress) {
    throw new Error("USDC_ADDRESS is not configured");
  }

  provider = new ethers.JsonRpcProvider(config.rpcUrl);
  wallet = config.privateKey
    ? new ethers.Wallet(config.privateKey, provider)
    : undefined;
  const runner = wallet ?? provider;

  escrowContract = new ethers.Contract(
    config.contractAddress,
    ESCROW_ABI,
    runner
  );
  usdcContract = new ethers.Contract(config.usdcAddress, ERC20_ABI, runner);

  console.log(`Blockchain initialized`);
  console.log(`  Wallet: ${wallet?.address ?? "not configured"}`);
  console.log(`  Contract: ${config.contractAddress}`);
  console.log(`  USDC: ${config.usdcAddress}`);
  console.log(`  RPC: ${config.rpcUrl}`);
}

export function getProvider() {
  return provider;
}

export function getWallet() {
  return wallet;
}

export function hasSigner() {
  return Boolean(wallet);
}

export function getEscrowContract() {
  return escrowContract;
}

export function getUsdcContract() {
  return usdcContract;
}

export async function fetchEscrowData(id: number): Promise<EscrowData> {
  const contract = getEscrowContract();
  const result = await contract.getEscrow(id);

  // Struct order: id, depositor, beneficiary, arbiter, amount, description, deadline, state, createdAt
  const [
    _id,
    depositor,
    beneficiary,
    arbiter,
    amount,
    description,
    deadline,
    state,
    createdAt,
  ] = result;

  const stateNum = Number(state);
  const deadlineNum = Number(deadline);
  const createdAtNum = Number(createdAt);

  return {
    id,
    depositor,
    beneficiary,
    arbiter,
    amount: ethers.formatUnits(amount, 6), // USDC has 6 decimals
    amountRaw: amount.toString(),
    description,
    deadline: new Date(deadlineNum * 1000).toISOString(),
    deadlineTimestamp: deadlineNum,
    state: stateNum as EscrowState,
    stateName: STATE_NAMES[stateNum] || "Unknown",
    createdAt: new Date(createdAtNum * 1000).toISOString(),
  };
}

export function setupEventListeners() {
  const contract = getEscrowContract();

  contract.on(
    "EscrowCreated",
    (
      escrowId: bigint,
      depositor: string,
      beneficiary: string,
      amount: bigint,
      deadline: bigint,
      event: ethers.ContractEventPayload
    ) => {
      const escrowEvent: EscrowEvent = {
        type: "EscrowCreated",
        escrowId: Number(escrowId),
        timestamp: new Date().toISOString(),
        data: {
          depositor,
          beneficiary,
          amount: ethers.formatUnits(amount, 6),
          deadline: Number(deadline),
        },
        txHash: event.log.transactionHash,
      };
      eventBus.emit("escrow-event", escrowEvent);
    }
  );

  contract.on(
    "EscrowReleased",
    (
      escrowId: bigint,
      beneficiary: string,
      amount: bigint,
      event: ethers.ContractEventPayload
    ) => {
      const escrowEvent: EscrowEvent = {
        type: "EscrowReleased",
        escrowId: Number(escrowId),
        timestamp: new Date().toISOString(),
        data: {
          beneficiary,
          amount: ethers.formatUnits(amount, 6),
        },
        txHash: event.log.transactionHash,
      };
      eventBus.emit("escrow-event", escrowEvent);
    }
  );

  contract.on(
    "EscrowDisputed",
    (
      escrowId: bigint,
      disputedBy: string,
      event: ethers.ContractEventPayload
    ) => {
      const escrowEvent: EscrowEvent = {
        type: "EscrowDisputed",
        escrowId: Number(escrowId),
        timestamp: new Date().toISOString(),
        data: { disputedBy },
        txHash: event.log.transactionHash,
      };
      eventBus.emit("escrow-event", escrowEvent);
    }
  );

  contract.on(
    "EscrowResolved",
    (
      escrowId: bigint,
      releasedToBeneficiary: boolean,
      amount: bigint,
      event: ethers.ContractEventPayload
    ) => {
      const escrowEvent: EscrowEvent = {
        type: "EscrowResolved",
        escrowId: Number(escrowId),
        timestamp: new Date().toISOString(),
        data: { releasedToBeneficiary, amount: ethers.formatUnits(amount, 6) },
        txHash: event.log.transactionHash,
      };
      eventBus.emit("escrow-event", escrowEvent);
    }
  );

  contract.on(
    "EscrowExpired",
    (
      escrowId: bigint,
      depositor: string,
      amount: bigint,
      event: ethers.ContractEventPayload
    ) => {
      const escrowEvent: EscrowEvent = {
        type: "EscrowExpired",
        escrowId: Number(escrowId),
        timestamp: new Date().toISOString(),
        data: {
          depositor,
          amount: ethers.formatUnits(amount, 6),
        },
        txHash: event.log.transactionHash,
      };
      eventBus.emit("escrow-event", escrowEvent);
    }
  );

  console.log("Event listeners set up");
}
