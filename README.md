# Pactum

**Trustless service agreements for the agentic economy.**

Pactum is an intelligent contract protocol on GenLayer that enables AI agents and humans to form binding service agreements, lock funds in escrow, and have deliverables evaluated by AI consensus.

## The Problem

As AI agents begin transacting autonomously, they need enforceable agreements. Traditional smart contracts can't evaluate subjective deliverables like "was this data clean?" or "does this report answer the question?" There's no onchain way to judge whether work was actually done well.

## The Solution

Pactum uses GenLayer's Optimistic Democracy consensus to make those judgments trustlessly. When a deliverable is submitted, validators running diverse LLMs independently fetch the work, evaluate it against the agreed terms, and reach consensus on whether it was fulfilled.

## How It Works

1. **Create a Pact** — A client defines the work terms in natural language, sets a deadline, and specifies the payment amount.
2. **Submit Deliverable** — The provider completes the work and submits a URL pointing to the deliverable.
3. **AI Evaluation** — Either party triggers evaluation. Validators fetch the deliverable, reason about whether it meets the terms, and vote on the outcome.
4. **Resolution** — If consensus determines the work was fulfilled, funds release to the provider. If not, funds return to the client. Reputation updates either way.

## Tech Stack

- **Intelligent Contract**: Python (GenVM SDK)
- **Consensus**: Optimistic Democracy with custom validator functions
- **AI Evaluation**: LLM-powered deliverable assessment with web fetching
- **Frontend**: React + TypeScript + Tailwind CSS
- **SDK**: GenLayer JS
- **Deployment**: Testnet Bradbury

## Contract Address (Testnet Bradbury)

```
0x3abebBbFA10B6bc4c180d05419923EA493481c57
```

## Contract Methods

### Write Methods
- `create_pact(provider, terms, deadline_timestamp, amount)` — Create a new service agreement
- `submit_deliverable(pact_id, deliverable_url, note)` — Provider submits completed work
- `approve_deliverable(pact_id)` — Client manually approves without AI evaluation
- `evaluate_deliverable(pact_id)` — Trigger AI consensus evaluation of the deliverable
- `cancel_pact(pact_id)` — Client cancels before provider submits
- `claim_expired(pact_id)` — Claim refund after deadline passes

### Read Methods
- `get_pact(pact_id)` — Get full pact details
- `get_all_pacts()` — List all pacts
- `get_active_pacts()` — List active pacts
- `get_pact_count()` — Total number of pacts
- `get_reputation(agent)` — Get agent's track record

## AI Evaluation Details

The `evaluate_deliverable` method uses `gl.vm.run_nondet_unsafe` with a custom validator function:

- **Leader** fetches the deliverable URL, prompts an LLM to judge fulfillment, returns `{fulfilled, score, reasoning}`
- **Validators** independently repeat the evaluation
- **Consensus rule**: Must agree on the `fulfilled` boolean; scores must be within ±2

This ensures fair, decentralized judgment even when different validators run different LLMs.

## Setup

### Prerequisites
- Python 3.12+
- Node.js 18+
- GenLayer CLI (`npm install -g genlayer`)

### Install & Lint
```bash
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
genvm-lint check contracts/pactum.py
```

### Deploy
```bash
genlayer network set testnet-bradbury
genlayer deploy --contract contracts/pactum.py
```

### Interact
```bash
# Read pact count
genlayer call <CONTRACT_ADDRESS> get_pact_count

# Create a pact
genlayer write <CONTRACT_ADDRESS> create_pact --args <PROVIDER_ADDRESS> "Build a website" 1743800000 1000
```

## Track

**Agentic Economy Infrastructure** — GenLayer Bradbury Builders Hackathon

## Why Pactum?

GenLayer positions itself as "a legal system for machines." Pactum is exactly that: enforceable service agreements where AI validators act as the judiciary. Every pact resolution generates transaction fees, and under GenLayer's dev fee model, 10-20% of those fees go to the contract creator permanently.

## Built By

**FK** ([@NamedFarouk](https://x.com/NamedFarouk)) — Web3 builder and open source contributor focused on the AI x blockchain intersection.

## License

MIT
