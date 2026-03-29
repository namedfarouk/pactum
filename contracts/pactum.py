# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import json
from dataclasses import dataclass
from genlayer import *


@allow_storage
@dataclass
class Pact:
    id: u256
    client: Address
    provider: Address
    terms: str
    deliverable_url: str
    amount: u256
    deadline_timestamp: u256
    status: str  # "active" | "submitted" | "approved" | "disputed" | "resolved" | "expired"
    created_at: u256
    submission_note: str


@allow_storage
@dataclass
class AgentReputation:
    completed: u256
    disputed: u256
    failed: u256
    total_earned: u256


class Pactum(gl.Contract):
    pacts: TreeMap[u256, Pact]
    pact_counter: u256
    reputation: TreeMap[Address, AgentReputation]

    def __init__(self):
        self.pact_counter = u256(0)

    # ── Write Methods ──────────────────────────────────────────────

    @gl.public.write
    def create_pact(
        self, provider: Address, terms: str, deadline_timestamp: int, amount: int
    ) -> None:
        if gl.message.sender_address == provider:
            raise gl.vm.UserError("Client and provider cannot be the same")
        if not terms:
            raise gl.vm.UserError("Terms cannot be empty")

        self.pact_counter += u256(1)
        pact_id = self.pact_counter

        pact = Pact(
            id=pact_id,
            client=gl.message.sender_address,
            provider=provider,
            terms=terms,
            deliverable_url="",
            amount=u256(int(amount)),
            deadline_timestamp=u256(int(deadline_timestamp)),
            status="active",
            created_at=u256(0),
            submission_note="",
        )
        self.pacts[pact_id] = pact

    @gl.public.write
    def submit_deliverable(
        self, pact_id: int, deliverable_url: str, note: str
    ) -> None:
        pact_id = u256(int(pact_id))
        if pact_id not in self.pacts:
            raise gl.vm.UserError("Pact does not exist")

        pact = self.pacts[pact_id]

        if gl.message.sender_address != pact.provider:
            raise gl.vm.UserError("Only the provider can submit a deliverable")
        if pact.status != "active":
            raise gl.vm.UserError("Pact is not in active state")
        if not deliverable_url:
            raise gl.vm.UserError("Deliverable URL cannot be empty")

        pact.status = "submitted"
        pact.deliverable_url = deliverable_url
        pact.submission_note = note

    @gl.public.write
    def approve_deliverable(self, pact_id: int) -> None:
        pact_id = u256(int(pact_id))
        if pact_id not in self.pacts:
            raise gl.vm.UserError("Pact does not exist")

        pact = self.pacts[pact_id]

        if gl.message.sender_address != pact.client:
            raise gl.vm.UserError("Only the client can manually approve")
        if pact.status != "submitted":
            raise gl.vm.UserError("Pact is not in submitted state")

        pact.status = "approved"

        # TODO: Re-enable escrow transfer when SDK supports payable
        # gl.ContractAt(pact.provider).emit_transfer(value=pact.amount)
        rep = self.reputation.get_or_insert_default(pact.provider)
        rep.completed += u256(1)
        rep.total_earned += pact.amount

    @gl.public.write
    def evaluate_deliverable(self, pact_id: int) -> None:
        pact_id = u256(int(pact_id))
        if pact_id not in self.pacts:
            raise gl.vm.UserError("Pact does not exist")

        pact = self.pacts[pact_id]

        if pact.status != "submitted":
            raise gl.vm.UserError("Pact is not in submitted state")

        caller = gl.message.sender_address
        if caller != pact.client and caller != pact.provider:
            raise gl.vm.UserError("Only client or provider can trigger evaluation")

        # Copy needed values to memory for nondet block
        terms = str(pact.terms)
        deliverable_url = str(pact.deliverable_url)
        submission_note = str(pact.submission_note)

        def leader_fn():
            web_content = gl.nondet.web.render(deliverable_url, mode="text")

            prompt = f"""You are an impartial judge evaluating whether a service deliverable
meets the agreed terms of a contract.

CONTRACT TERMS:
{terms}

DELIVERABLE CONTENT (fetched from {deliverable_url}):
{web_content[:4000]}

PROVIDER'S NOTE:
{submission_note}

Evaluate whether the deliverable satisfactorily fulfills the contract terms.
Return JSON with:
- "fulfilled": boolean (true if work meets the terms)
- "score": integer 1-10 (quality score)
- "reasoning": string (brief explanation)

It is mandatory that you respond only using the JSON format above,
nothing else. Don't include any other words or characters,
your output must be only JSON without any formatting prefix or suffix.
This result should be perfectly parsable by a JSON parser without errors.
"""
            result = gl.nondet.exec_prompt(prompt, response_format="json")
            return result

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            leader_data = leader_result.calldata
            my_data = leader_fn()

            # Must agree on the boolean outcome
            if leader_data.get("fulfilled") != my_data.get("fulfilled"):
                return False

            # Scores within ±2 is acceptable
            leader_score = leader_data.get("score", 0)
            my_score = my_data.get("score", 0)
            return abs(leader_score - my_score) <= 2

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        fulfilled = result.get("fulfilled", False)

        if fulfilled:
            pact.status = "resolved"
            # TODO: Re-enable escrow transfer when SDK supports payable
            # gl.ContractAt(pact.provider).emit_transfer(value=pact.amount)
            rep = self.reputation.get_or_insert_default(pact.provider)
            rep.completed += u256(1)
            rep.total_earned += pact.amount
        else:
            pact.status = "resolved"
            # TODO: Re-enable escrow refund when SDK supports payable
            # gl.ContractAt(pact.client).emit_transfer(value=pact.amount)
            rep = self.reputation.get_or_insert_default(pact.provider)
            rep.failed += u256(1)

    @gl.public.write
    def cancel_pact(self, pact_id: int) -> None:
        pact_id = u256(int(pact_id))
        if pact_id not in self.pacts:
            raise gl.vm.UserError("Pact does not exist")

        pact = self.pacts[pact_id]

        if gl.message.sender_address != pact.client:
            raise gl.vm.UserError("Only the client can cancel a pact")
        if pact.status != "active":
            raise gl.vm.UserError("Can only cancel active pacts (before submission)")

        pact.status = "expired"
        # TODO: Re-enable escrow refund when SDK supports payable
        # gl.ContractAt(pact.client).emit_transfer(value=pact.amount)

    @gl.public.write
    def claim_expired(self, pact_id: int) -> None:
        pact_id = u256(int(pact_id))
        if pact_id not in self.pacts:
            raise gl.vm.UserError("Pact does not exist")

        pact = self.pacts[pact_id]

        if pact.status != "active":
            raise gl.vm.UserError("Pact is not in active state")
        if pact.deadline_timestamp == u256(0):
            raise gl.vm.UserError("Pact has no deadline set")

        # Note: In production, compare against block.timestamp
        # For now, this method is callable and the caller asserts the deadline has passed

        pact.status = "expired"
        # TODO: Re-enable escrow refund when SDK supports payable
        # gl.ContractAt(pact.client).emit_transfer(value=pact.amount)

        rep = self.reputation.get_or_insert_default(pact.provider)
        rep.failed += u256(1)

    # ── Read Methods ───────────────────────────────────────────────

    @gl.public.view
    def get_pact(self, pact_id: int) -> dict:
        pact_id = u256(int(pact_id))
        if pact_id not in self.pacts:
            raise gl.vm.UserError("Pact does not exist")
        pact = self.pacts[pact_id]
        return {
            "id": int(pact.id),
            "client": pact.client.as_hex,
            "provider": pact.provider.as_hex,
            "terms": pact.terms,
            "deliverable_url": pact.deliverable_url,
            "amount": int(pact.amount),
            "deadline_timestamp": int(pact.deadline_timestamp),
            "status": pact.status,
            "created_at": int(pact.created_at),
            "submission_note": pact.submission_note,
        }

    @gl.public.view
    def get_reputation(self, agent: str) -> dict:
        addr = Address(agent)
        if addr not in self.reputation:
            return {
                "completed": 0,
                "disputed": 0,
                "failed": 0,
                "total_earned": 0,
            }
        rep = self.reputation[addr]
        return {
            "completed": int(rep.completed),
            "disputed": int(rep.disputed),
            "failed": int(rep.failed),
            "total_earned": int(rep.total_earned),
        }

    @gl.public.view
    def get_active_pacts(self) -> list:
        result = []
        for pact_id, pact in self.pacts.items():
            if pact.status == "active":
                result.append({
                    "id": int(pact.id),
                    "client": pact.client.as_hex,
                    "provider": pact.provider.as_hex,
                    "terms": pact.terms,
                    "amount": int(pact.amount),
                    "deadline_timestamp": int(pact.deadline_timestamp),
                    "status": pact.status,
                })
        return result

    @gl.public.view
    def get_all_pacts(self) -> list:
        result = []
        for pact_id, pact in self.pacts.items():
            result.append({
                "id": int(pact.id),
                "client": pact.client.as_hex,
                "provider": pact.provider.as_hex,
                "terms": pact.terms,
                "deliverable_url": pact.deliverable_url,
                "amount": int(pact.amount),
                "deadline_timestamp": int(pact.deadline_timestamp),
                "status": pact.status,
                "created_at": int(pact.created_at),
                "submission_note": pact.submission_note,
            })
        return result

    @gl.public.view
    def get_pact_count(self) -> int:
        return int(self.pact_counter)
