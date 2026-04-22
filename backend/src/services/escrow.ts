import { ethers } from "ethers";
import {
  getEscrowContract,
  getUsdcContract,
  fetchEscrowData,
  hasSigner,
} from "./blockchain";
import { config } from "../config";
import { CreateEscrowRequest, EscrowData, EscrowState } from "../types";

export async function getEscrows(filters?: {
  state?: number;
  depositor?: string;
  beneficiary?: string;
}): Promise<EscrowData[]> {
  const contract = getEscrowContract();
  const count = Number(await contract.getEscrowCount());
  const escrows: EscrowData[] = [];

  for (let i = 0; i < count; i++) {
    try {
      const escrow = await fetchEscrowData(i);

      if (filters?.state !== undefined && escrow.state !== filters.state) {
        continue;
      }
      if (
        filters?.depositor &&
        escrow.depositor.toLowerCase() !== filters.depositor.toLowerCase()
      ) {
        continue;
      }
      if (
        filters?.beneficiary &&
        escrow.beneficiary.toLowerCase() !== filters.beneficiary.toLowerCase()
      ) {
        continue;
      }

      escrows.push(escrow);
    } catch (err) {
      console.error(`Failed to fetch escrow ${i}:`, err);
    }
  }

  return escrows;
}

export async function getEscrow(id: number): Promise<EscrowData> {
  return fetchEscrowData(id);
}

export async function createEscrow(
  request: CreateEscrowRequest
): Promise<{ escrowId: number; txHash: string }> {
  if (!hasSigner()) {
    throw new Error("Action unavailable");
  }

  const { beneficiary, amount, description, deadline_hours } = request;

  if (!ethers.isAddress(beneficiary)) {
    throw new Error("Invalid beneficiary address");
  }
  if (amount <= 0) {
    throw new Error("Amount must be positive");
  }
  if (deadline_hours <= 0) {
    throw new Error("Deadline hours must be positive");
  }

  const usdcContract = getUsdcContract();
  const escrowContract = getEscrowContract();

  // USDC has 6 decimals
  const amountRaw = ethers.parseUnits(amount.toString(), 6);

  // Calculate deadline as unix timestamp
  const deadlineTimestamp = Math.floor(
    Date.now() / 1000 + deadline_hours * 3600
  );

  // Step 1: Approve USDC spending
  const currentAllowance = await usdcContract.allowance(
    await escrowContract.runner!.getAddress!(),
    config.contractAddress
  );

  if (currentAllowance < amountRaw) {
    console.log("Approving USDC spend...");
    const approveTx = await usdcContract.approve(
      config.contractAddress,
      amountRaw
    );
    await approveTx.wait();
    console.log("USDC approved");
  }

  // Step 2: Create the escrow
  console.log("Creating escrow...");
  const tx = await escrowContract.createEscrow(
    beneficiary,
    amountRaw,
    description,
    deadlineTimestamp
  );
  const receipt = await tx.wait();

  // Parse the EscrowCreated event to get the escrow ID
  let escrowId = -1;
  for (const log of receipt.logs) {
    try {
      const parsed = escrowContract.interface.parseLog({
        topics: log.topics as string[],
        data: log.data,
      });
      if (parsed?.name === "EscrowCreated") {
        escrowId = Number(parsed.args[0]);
        break;
      }
    } catch {
      // Not our event, skip
    }
  }

  if (escrowId === -1) {
    // Fallback: get the count and subtract 1
    const count = Number(await escrowContract.getEscrowCount());
    escrowId = count - 1;
  }

  console.log(`Escrow created: ID=${escrowId}, TX=${receipt.hash}`);
  return { escrowId, txHash: receipt.hash };
}

export async function releaseEscrow(
  id: number
): Promise<{ txHash: string }> {
  if (!hasSigner()) {
    throw new Error("Action unavailable");
  }

  const contract = getEscrowContract();
  const tx = await contract.release(id);
  const receipt = await tx.wait();
  console.log(`Escrow ${id} released: TX=${receipt.hash}`);
  return { txHash: receipt.hash };
}

export async function disputeEscrow(
  id: number
): Promise<{ txHash: string }> {
  if (!hasSigner()) {
    throw new Error("Action unavailable");
  }

  const contract = getEscrowContract();
  const tx = await contract.dispute(id);
  const receipt = await tx.wait();
  console.log(`Escrow ${id} disputed: TX=${receipt.hash}`);
  return { txHash: receipt.hash };
}

export async function resolveDispute(
  id: number,
  releaseToBeneficiary: boolean
): Promise<{ txHash: string }> {
  if (!hasSigner()) {
    throw new Error("Action unavailable");
  }

  const contract = getEscrowContract();
  const tx = await contract.resolveDispute(id, releaseToBeneficiary);
  const receipt = await tx.wait();
  console.log(
    `Escrow ${id} resolved (to beneficiary: ${releaseToBeneficiary}): TX=${receipt.hash}`
  );
  return { txHash: receipt.hash };
}

export async function claimExpired(
  id: number
): Promise<{ txHash: string }> {
  if (!hasSigner()) {
    throw new Error("Action unavailable");
  }

  const contract = getEscrowContract();
  const tx = await contract.claimExpired(id);
  const receipt = await tx.wait();
  console.log(`Escrow ${id} expired claimed: TX=${receipt.hash}`);
  return { txHash: receipt.hash };
}

export async function getStats(): Promise<{
  total: number;
  active: number;
  released: number;
  disputed: number;
  refunded: number;
  expired: number;
  volume: string;
}> {
  const contract = getEscrowContract();
  const count = Number(await contract.getEscrowCount());

  let active = 0;
  let released = 0;
  let disputed = 0;
  let refunded = 0;
  let expired = 0;
  let totalVolume = BigInt(0);

  for (let i = 0; i < count; i++) {
    try {
      const escrow = await fetchEscrowData(i);
      totalVolume += BigInt(escrow.amountRaw);

      switch (escrow.state) {
        case EscrowState.Active:
          active++;
          break;
        case EscrowState.Released:
          released++;
          break;
        case EscrowState.Disputed:
          disputed++;
          break;
        case EscrowState.Refunded:
          refunded++;
          break;
        case EscrowState.Expired:
          expired++;
          break;
      }
    } catch (err) {
      console.error(`Failed to fetch escrow ${i} for stats:`, err);
    }
  }

  return {
    total: count,
    active,
    released,
    disputed,
    refunded,
    expired,
    volume: ethers.formatUnits(totalVolume, 6),
  };
}
