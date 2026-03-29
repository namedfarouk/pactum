/**
 * TypeScript types for Pactum intelligent contract
 */

export type PactStatus =
  | "active"
  | "submitted"
  | "approved"
  | "disputed"
  | "resolved"
  | "expired";

export interface Pact {
  id: number;
  client: string;
  provider: string;
  terms: string;
  deliverable_url: string;
  amount: number;
  deadline_timestamp: number;
  status: PactStatus;
  created_at: number;
  submission_note: string;
}

export interface AgentReputation {
  completed: number;
  disputed: number;
  failed: number;
  total_earned: number;
}

export interface TransactionReceipt {
  status: string;
  hash: string;
  blockNumber?: number;
  [key: string]: any;
}
