#!/usr/bin/env node

/**
 * End-to-end test for the Pactum contract on Bradbury testnet.
 *
 * Usage:
 *   PRIVATE_KEY=0x... node scripts/test-pact-flow.mjs
 */

import { createClient, createAccount } from "genlayer-js";
import { testnetAsimov } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

// ── Config ───────────────────────────────────────────────────────────
const CONTRACT_ADDRESS = "0x7106Ad697cD18bb5cE9052feC2b8b4059174Fe54";
const PROVIDER_ADDRESS = "0xc8771EAf0db887860dEC5b86Abb707ed0Bd93Bc2";
const BRADBURY_RPC = "https://rpc-bradbury.genlayer.com";

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  console.error("Error: PRIVATE_KEY env var is required");
  console.error("Usage: PRIVATE_KEY=0x... node scripts/test-pact-flow.mjs");
  process.exit(1);
}

// ── Setup ────────────────────────────────────────────────────────────
const account = createAccount(privateKey);
console.log(`Account: ${account.address}`);

const client = createClient({
  chain: testnetAsimov,
  endpoint: BRADBURY_RPC,
  account,
});

// ── Step 1: Read current pact count ──────────────────────────────────
console.log("\n── Step 1: Reading current pact count...");
const countBefore = await client.readContract({
  address: CONTRACT_ADDRESS,
  functionName: "get_pact_count",
  args: [],
});
console.log(`Current pact count: ${countBefore}`);

// ── Step 2: Create a pact with 1000 units escrow ────────────────────
console.log("\n── Step 2: Creating pact (payable, 1000 units escrow)...");
const txHash = await client.writeContract({
  account,
  address: CONTRACT_ADDRESS,
  functionName: "create_pact",
  args: [PROVIDER_ADDRESS, "Build a portfolio website", 1743800000],
  value: 1000n,
});
console.log(`Transaction hash: ${txHash}`);

// ── Step 3: Wait for transaction receipt ─────────────────────────────
console.log("\n── Step 3: Waiting for transaction to finalize...");
const receipt = await client.waitForTransactionReceipt({
  hash: txHash,
  status: TransactionStatus.FINALIZED,
  interval: 5000,
  retries: 60,
});
console.log("Transaction finalized!");
console.log(`Receipt status: ${receipt.status}`);

// ── Step 4: Read pact count again ────────────────────────────────────
console.log("\n── Step 4: Reading pact count after creation...");
const countAfter = await client.readContract({
  address: CONTRACT_ADDRESS,
  functionName: "get_pact_count",
  args: [],
});
console.log(`Pact count: ${countBefore} → ${countAfter}`);

if (Number(countAfter) > Number(countBefore)) {
  console.log("✓ Pact count increased!");
} else {
  console.error("✗ Pact count did not increase");
}

// ── Step 5: Read the new pact ────────────────────────────────────────
const newPactId = Number(countAfter);
console.log(`\n── Step 5: Reading pact #${newPactId}...`);
const pact = await client.readContract({
  address: CONTRACT_ADDRESS,
  functionName: "get_pact",
  args: [newPactId],
});
console.log("Pact data:");
console.log(JSON.stringify(pact, (_, v) => (typeof v === "bigint" ? v.toString() : v), 2));

console.log("\n✓ Full flow complete!");
