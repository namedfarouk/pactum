"use client";

import { useState } from "react";
import {
  useSubmitDeliverable,
  useApproveDeliverable,
  useEvaluateDeliverable,
  useCancelPact,
} from "@/lib/hooks/usePactum";
import { warning } from "@/lib/utils/toast";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import type { Pact } from "@/lib/contracts/types";

interface PactActionsProps {
  pact: Pact;
  isClient: boolean;
  isProvider: boolean;
}

export function PactActions({ pact, isClient, isProvider }: PactActionsProps) {
  const { submitDeliverable, isSubmitting } = useSubmitDeliverable();
  const { approveDeliverable, isApproving } = useApproveDeliverable();
  const { evaluateDeliverable, isEvaluating } = useEvaluateDeliverable();
  const { cancelPact, isCancelling } = useCancelPact();

  const [deliverableUrl, setDeliverableUrl] = useState("");
  const [note, setNote] = useState("");

  if (!isClient && !isProvider) return null;

  return (
    <div className="space-y-3">
      {/* Provider: Submit Deliverable */}
      {isProvider && pact.status === "active" && (
        <div className="space-y-2 p-3 rounded-lg bg-muted/10 border border-muted/20">
          <p className="text-sm font-medium">Submit Deliverable</p>
          <Input
            placeholder="Deliverable URL (e.g., GitHub repo, deployed site)"
            value={deliverableUrl}
            onChange={(e) => setDeliverableUrl(e.target.value)}
            disabled={isSubmitting}
          />
          <Input
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={isSubmitting}
          />
          <Button
            variant="gradient"
            size="sm"
            disabled={isSubmitting || !deliverableUrl}
            onClick={() => {
              if (!deliverableUrl) {
                warning("Please provide a deliverable URL");
                return;
              }
              submitDeliverable({
                pactId: pact.id,
                deliverableUrl,
                note,
              });
            }}
          >
            {isSubmitting ? "Submitting..." : "Submit Deliverable"}
          </Button>
        </div>
      )}

      {/* Client: Approve or Evaluate submitted deliverable */}
      {isClient && pact.status === "submitted" && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="gradient"
            size="sm"
            disabled={isApproving}
            onClick={() => approveDeliverable(pact.id)}
          >
            {isApproving ? "Approving..." : "Approve & Release Funds"}
          </Button>
          <Button
            variant="blue"
            size="sm"
            disabled={isEvaluating}
            onClick={() => evaluateDeliverable(pact.id)}
          >
            {isEvaluating ? "AI Evaluating..." : "Request AI Evaluation"}
          </Button>
        </div>
      )}

      {/* Provider: Can also trigger AI evaluation on submitted */}
      {isProvider && pact.status === "submitted" && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="blue"
            size="sm"
            disabled={isEvaluating}
            onClick={() => evaluateDeliverable(pact.id)}
          >
            {isEvaluating ? "AI Evaluating..." : "Request AI Evaluation"}
          </Button>
        </div>
      )}

      {/* Client: Cancel active pact */}
      {isClient && pact.status === "active" && (
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          disabled={isCancelling}
          onClick={() => cancelPact(pact.id)}
        >
          {isCancelling ? "Cancelling..." : "Cancel Pact & Refund"}
        </Button>
      )}
    </div>
  );
}
