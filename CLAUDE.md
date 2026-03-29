# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Commands

```bash
npm run deploy          # Deploy contracts via GenLayer CLI
gltest                  # Run contract tests (requires GenLayer Studio running)
genlayer network        # Select network (studionet/localnet/testnet)
genvm-lint check contracts/pactum.py  # Lint the contract
```

## Architecture

```
contracts/          # Python intelligent contracts (Pactum)
deploy/             # TypeScript deployment scripts
test/               # Python integration tests (gltest)
frontend/           # Built separately via Lovable
```

## What is Pactum?

Pactum is a trustless service agreement protocol on GenLayer. It enables:
- Creating binding service agreements with escrowed funds
- Submitting deliverables (URLs to completed work)
- AI-powered evaluation of deliverables against natural language terms
- Reputation tracking for providers

## Contract: Pactum (contracts/pactum.py)

### Key Methods
- `create_pact(provider, terms, deadline_timestamp)` - Payable, creates escrow
- `submit_deliverable(pact_id, deliverable_url, note)` - Provider submits work
- `approve_deliverable(pact_id)` - Client manually approves
- `evaluate_deliverable(pact_id)` - AI evaluation via GenLayer consensus
- `cancel_pact(pact_id)` - Client cancels before submission
- `claim_expired(pact_id)` - Claim refund after deadline

### Read Methods
- `get_pact(pact_id)` - Single pact details
- `get_all_pacts()` - All pacts
- `get_active_pacts()` - Active pacts only
- `get_reputation(agent)` - Agent's reputation stats
- `get_pact_count()` - Total pact count

## Development Workflow

1. Ensure GenLayer Studio is running (local or https://studio.genlayer.com)
2. Select network: `genlayer network`
3. Deploy contract: `npm run deploy`
4. Run tests: `gltest test/ -v -s`

## GenLayer Technical Reference

> **Can't solve an issue?** Always check the complete SDK API reference:
> **https://sdk.genlayer.com/main/_static/ai/api.txt**

### Documentation URLs

| Resource | URL |
|----------|-----|
| **SDK API (Complete)** | https://sdk.genlayer.com/main/_static/ai/api.txt |
| Full Documentation | https://docs.genlayer.com/full-documentation.txt |
| Main Docs | https://docs.genlayer.com/ |
| GenLayerJS SDK | https://docs.genlayer.com/api-references/genlayer-js |
