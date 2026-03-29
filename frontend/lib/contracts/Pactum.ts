import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import type { Pact, AgentReputation, TransactionReceipt } from "./types";

class PactumContract {
  private contractAddress: `0x${string}`;
  private client: ReturnType<typeof createClient>;

  constructor(
    contractAddress: string,
    address?: string | null,
    studioUrl?: string
  ) {
    this.contractAddress = contractAddress as `0x${string}`;

    const config: any = {
      chain: studionet,
    };

    if (address) {
      config.account = address as `0x${string}`;
    }

    if (studioUrl) {
      config.endpoint = studioUrl;
    }

    this.client = createClient(config);
  }

  updateAccount(address: string): void {
    const config: any = {
      chain: studionet,
      account: address as `0x${string}`,
    };
    this.client = createClient(config);
  }

  // ── Read Methods ────────────────────────────────────────────

  async getPact(pactId: number): Promise<Pact> {
    try {
      const result: any = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_pact",
        args: [pactId],
      });
      return this.parsePact(result);
    } catch (error) {
      console.error("Error fetching pact:", error);
      throw new Error("Failed to fetch pact");
    }
  }

  async getAllPacts(): Promise<Pact[]> {
    try {
      const result: any = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_all_pacts",
        args: [],
      });
      if (Array.isArray(result)) {
        return result.map((p: any) => this.parsePact(p));
      }
      return [];
    } catch (error) {
      console.error("Error fetching all pacts:", error);
      throw new Error("Failed to fetch pacts");
    }
  }

  async getActivePacts(): Promise<Pact[]> {
    try {
      const result: any = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_active_pacts",
        args: [],
      });
      if (Array.isArray(result)) {
        return result.map((p: any) => this.parsePact(p));
      }
      return [];
    } catch (error) {
      console.error("Error fetching active pacts:", error);
      throw new Error("Failed to fetch active pacts");
    }
  }

  async getReputation(agent: string): Promise<AgentReputation> {
    try {
      const result: any = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_reputation",
        args: [agent],
      });
      return this.parseReputation(result);
    } catch (error) {
      console.error("Error fetching reputation:", error);
      return { completed: 0, disputed: 0, failed: 0, total_earned: 0 };
    }
  }

  async getPactCount(): Promise<number> {
    try {
      const result = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_pact_count",
        args: [],
      });
      return Number(result) || 0;
    } catch (error) {
      console.error("Error fetching pact count:", error);
      return 0;
    }
  }

  // ── Write Methods ───────────────────────────────────────────

  async createPact(
    provider: string,
    terms: string,
    deadlineTimestamp: number,
    amount: bigint
  ): Promise<TransactionReceipt> {
    try {
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "create_pact",
        args: [provider, terms, deadlineTimestamp],
        value: amount,
      });

      const receipt = await this.client.waitForTransactionReceipt({
        hash: txHash,
        status: "ACCEPTED" as any,
        retries: 30,
        interval: 5000,
      });

      return receipt as TransactionReceipt;
    } catch (error) {
      console.error("Error creating pact:", error);
      throw new Error("Failed to create pact");
    }
  }

  async submitDeliverable(
    pactId: number,
    deliverableUrl: string,
    note: string
  ): Promise<TransactionReceipt> {
    try {
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "submit_deliverable",
        args: [pactId, deliverableUrl, note],
        value: BigInt(0),
      });

      const receipt = await this.client.waitForTransactionReceipt({
        hash: txHash,
        status: "ACCEPTED" as any,
        retries: 30,
        interval: 5000,
      });

      return receipt as TransactionReceipt;
    } catch (error) {
      console.error("Error submitting deliverable:", error);
      throw new Error("Failed to submit deliverable");
    }
  }

  async approveDeliverable(pactId: number): Promise<TransactionReceipt> {
    try {
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "approve_deliverable",
        args: [pactId],
        value: BigInt(0),
      });

      const receipt = await this.client.waitForTransactionReceipt({
        hash: txHash,
        status: "ACCEPTED" as any,
        retries: 30,
        interval: 5000,
      });

      return receipt as TransactionReceipt;
    } catch (error) {
      console.error("Error approving deliverable:", error);
      throw new Error("Failed to approve deliverable");
    }
  }

  async evaluateDeliverable(pactId: number): Promise<TransactionReceipt> {
    try {
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "evaluate_deliverable",
        args: [pactId],
        value: BigInt(0),
      });

      const receipt = await this.client.waitForTransactionReceipt({
        hash: txHash,
        status: "ACCEPTED" as any,
        retries: 60,
        interval: 5000,
      });

      return receipt as TransactionReceipt;
    } catch (error) {
      console.error("Error evaluating deliverable:", error);
      throw new Error("Failed to evaluate deliverable");
    }
  }

  async cancelPact(pactId: number): Promise<TransactionReceipt> {
    try {
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "cancel_pact",
        args: [pactId],
        value: BigInt(0),
      });

      const receipt = await this.client.waitForTransactionReceipt({
        hash: txHash,
        status: "ACCEPTED" as any,
        retries: 30,
        interval: 5000,
      });

      return receipt as TransactionReceipt;
    } catch (error) {
      console.error("Error cancelling pact:", error);
      throw new Error("Failed to cancel pact");
    }
  }

  async claimExpired(pactId: number): Promise<TransactionReceipt> {
    try {
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "claim_expired",
        args: [pactId],
        value: BigInt(0),
      });

      const receipt = await this.client.waitForTransactionReceipt({
        hash: txHash,
        status: "ACCEPTED" as any,
        retries: 30,
        interval: 5000,
      });

      return receipt as TransactionReceipt;
    } catch (error) {
      console.error("Error claiming expired pact:", error);
      throw new Error("Failed to claim expired pact");
    }
  }

  // ── Helpers ─────────────────────────────────────────────────

  private parsePact(raw: any): Pact {
    if (raw instanceof Map) {
      const obj: any = {};
      raw.forEach((v: any, k: any) => {
        obj[k] = v;
      });
      return {
        id: Number(obj.id || 0),
        client: String(obj.client || ""),
        provider: String(obj.provider || ""),
        terms: String(obj.terms || ""),
        deliverable_url: String(obj.deliverable_url || ""),
        amount: Number(obj.amount || 0),
        deadline_timestamp: Number(obj.deadline_timestamp || 0),
        status: String(obj.status || "active") as Pact["status"],
        created_at: Number(obj.created_at || 0),
        submission_note: String(obj.submission_note || ""),
      };
    }
    return {
      id: Number(raw?.id || 0),
      client: String(raw?.client || ""),
      provider: String(raw?.provider || ""),
      terms: String(raw?.terms || ""),
      deliverable_url: String(raw?.deliverable_url || ""),
      amount: Number(raw?.amount || 0),
      deadline_timestamp: Number(raw?.deadline_timestamp || 0),
      status: String(raw?.status || "active") as Pact["status"],
      created_at: Number(raw?.created_at || 0),
      submission_note: String(raw?.submission_note || ""),
    };
  }

  private parseReputation(raw: any): AgentReputation {
    if (raw instanceof Map) {
      const obj: any = {};
      raw.forEach((v: any, k: any) => {
        obj[k] = v;
      });
      return {
        completed: Number(obj.completed || 0),
        disputed: Number(obj.disputed || 0),
        failed: Number(obj.failed || 0),
        total_earned: Number(obj.total_earned || 0),
      };
    }
    return {
      completed: Number(raw?.completed || 0),
      disputed: Number(raw?.disputed || 0),
      failed: Number(raw?.failed || 0),
      total_earned: Number(raw?.total_earned || 0),
    };
  }
}

export default PactumContract;
