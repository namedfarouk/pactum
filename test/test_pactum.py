from gltest import get_contract_factory, default_account, Account
from gltest.helpers import load_fixture
from gltest.assertions import tx_execution_succeeded, tx_execution_failed


def deploy_contract():
    factory = get_contract_factory("Pactum")
    contract = factory.deploy()

    # Verify initial state
    pact_count = contract.get_pact_count(args=[])
    assert pact_count == 0

    all_pacts = contract.get_all_pacts(args=[])
    assert all_pacts == []

    active_pacts = contract.get_active_pacts(args=[])
    assert active_pacts == []

    return contract


def test_create_pact():
    """Test creating a pact with escrow"""
    contract = load_fixture(deploy_contract)

    provider = Account()

    # Create a pact with escrow
    result = contract.create_pact(
        args=[provider.address, "Build a REST API with authentication and docs", 1735689600],
    )
    assert tx_execution_succeeded(result)

    # Verify pact count
    pact_count = contract.get_pact_count(args=[])
    assert pact_count == 1

    # Verify pact details
    pact = contract.get_pact(args=[1])
    assert pact["id"] == 1
    assert pact["client"] == default_account.address
    assert pact["provider"] == provider.address
    assert pact["terms"] == "Build a REST API with authentication and docs"
    assert pact["amount"] == 1000
    assert pact["status"] == "active"
    assert pact["deliverable_url"] == ""
    assert pact["submission_note"] == ""

    # Verify active pacts
    active_pacts = contract.get_active_pacts(args=[])
    assert len(active_pacts) == 1
    assert active_pacts[0]["id"] == 1


def test_submit_deliverable():
    """Test provider submitting a deliverable"""
    contract = load_fixture(deploy_contract)

    provider = Account()

    # Create pact
    contract.create_pact(
        args=[provider.address, "Build a website", 1735689600],
        value=500,
    )

    # Submit deliverable as provider
    result = contract.submit_deliverable(
        args=[1, "https://github.com/example/website", "Website deployed and live"],
        from_account=provider,
    )
    assert tx_execution_succeeded(result)

    # Verify pact updated
    pact = contract.get_pact(args=[1])
    assert pact["status"] == "submitted"
    assert pact["deliverable_url"] == "https://github.com/example/website"
    assert pact["submission_note"] == "Website deployed and live"


def test_approve_deliverable():
    """Test client manually approving a deliverable"""
    contract = load_fixture(deploy_contract)

    provider = Account()

    # Create pact
    contract.create_pact(
        args=[provider.address, "Write documentation", 1735689600],
        value=200,
    )

    # Submit deliverable as provider
    contract.submit_deliverable(
        args=[1, "https://docs.example.com", "Docs complete"],
        from_account=provider,
    )

    # Approve as client
    result = contract.approve_deliverable(args=[1])
    assert tx_execution_succeeded(result)

    # Verify pact status
    pact = contract.get_pact(args=[1])
    assert pact["status"] == "approved"

    # Verify reputation updated
    rep = contract.get_reputation(args=[provider.address])
    assert rep["completed"] == 1
    assert rep["total_earned"] == 200


def test_cancel_pact():
    """Test client cancelling an active pact"""
    contract = load_fixture(deploy_contract)

    provider = Account()

    # Create pact
    contract.create_pact(
        args=[provider.address, "Design a logo", 1735689600],
        value=300,
    )

    # Cancel as client
    result = contract.cancel_pact(args=[1])
    assert tx_execution_succeeded(result)

    # Verify pact expired
    pact = contract.get_pact(args=[1])
    assert pact["status"] == "expired"


def test_cannot_cancel_submitted_pact():
    """Test that client cannot cancel a submitted pact"""
    contract = load_fixture(deploy_contract)

    provider = Account()

    # Create and submit
    contract.create_pact(
        args=[provider.address, "Some work", 1735689600],
        value=100,
    )
    contract.submit_deliverable(
        args=[1, "https://example.com", "Done"],
        from_account=provider,
    )

    # Try to cancel - should fail
    result = contract.cancel_pact(args=[1])
    assert tx_execution_failed(result)


def test_provider_cannot_approve():
    """Test that provider cannot approve their own deliverable"""
    contract = load_fixture(deploy_contract)

    provider = Account()

    # Create and submit
    contract.create_pact(
        args=[provider.address, "Some work", 1735689600],
        value=100,
    )
    contract.submit_deliverable(
        args=[1, "https://example.com", "Done"],
        from_account=provider,
    )

    # Provider tries to approve - should fail
    result = contract.approve_deliverable(
        args=[1],
        from_account=provider,
    )
    assert tx_execution_failed(result)


def test_reputation_tracking():
    """Test reputation is tracked correctly across multiple pacts"""
    contract = load_fixture(deploy_contract)

    provider = Account()

    # Create and approve two pacts
    for i in range(2):
        contract.create_pact(
            args=[provider.address, f"Task {i+1}", 1735689600],
            value=100,
        )
        contract.submit_deliverable(
            args=[i + 1, f"https://example.com/task{i+1}", f"Task {i+1} done"],
            from_account=provider,
        )
        contract.approve_deliverable(args=[i + 1])

    # Check reputation
    rep = contract.get_reputation(args=[provider.address])
    assert rep["completed"] == 2
    assert rep["total_earned"] == 200
    assert rep["failed"] == 0
    assert rep["disputed"] == 0


def test_claim_expired():
    """Test claiming an expired pact"""
    contract = load_fixture(deploy_contract)

    provider = Account()

    # Create pact with past deadline
    contract.create_pact(
        args=[provider.address, "Overdue work", 1000000],
        value=500,
    )

    # Claim expired
    result = contract.claim_expired(args=[1])
    assert tx_execution_succeeded(result)

    # Verify status
    pact = contract.get_pact(args=[1])
    assert pact["status"] == "expired"

    # Verify provider reputation marked as failed
    rep = contract.get_reputation(args=[provider.address])
    assert rep["failed"] == 1


def test_multiple_pacts():
    """Test creating multiple pacts and filtering"""
    contract = load_fixture(deploy_contract)

    provider1 = Account()
    provider2 = Account()

    # Create 3 pacts
    contract.create_pact(
        args=[provider1.address, "Task A", 1735689600],
        value=100,
    )
    contract.create_pact(
        args=[provider2.address, "Task B", 1735689600],
        value=200,
    )
    contract.create_pact(
        args=[provider1.address, "Task C", 1735689600],
        value=300,
    )

    # Verify count
    assert contract.get_pact_count(args=[]) == 3

    # All should be active
    active = contract.get_active_pacts(args=[])
    assert len(active) == 3

    # Submit one
    contract.submit_deliverable(
        args=[1, "https://example.com/a", "Done A"],
        from_account=provider1,
    )

    # Now only 2 active
    active = contract.get_active_pacts(args=[])
    assert len(active) == 2

    # All 3 still in get_all
    all_pacts = contract.get_all_pacts(args=[])
    assert len(all_pacts) == 3


def test_evaluate_deliverable():
    """Test AI evaluation of a deliverable (integration test requiring GenLayer Studio)"""
    contract = load_fixture(deploy_contract)

    provider = Account()

    # Create pact
    contract.create_pact(
        args=[
            provider.address,
            "Create a simple HTML page with a heading that says 'Hello World' and a paragraph with some text",
            1735689600,
        ],
    )

    # Submit deliverable - using a real public URL for testing
    contract.submit_deliverable(
        args=[
            1,
            "https://example.com",
            "Simple HTML page with heading and paragraph",
        ],
        from_account=provider,
    )

    # Trigger AI evaluation
    result = contract.evaluate_deliverable(
        args=[1],
        wait_interval=10000,
        wait_retries=30,
    )
    assert tx_execution_succeeded(result)

    # Verify pact was resolved
    pact = contract.get_pact(args=[1])
    assert pact["status"] == "resolved"
