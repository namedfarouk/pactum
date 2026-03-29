"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useWallet } from "@/lib/genlayer/wallet";
import { useCreatePact } from "@/lib/hooks/usePactum";
import { warning } from "@/lib/utils/toast";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function CreatePactModal() {
  const { isConnected } = useWallet();
  const { createPact, isCreating } = useCreatePact();
  const [isOpen, setIsOpen] = useState(false);

  const [provider, setProvider] = useState("");
  const [terms, setTerms] = useState("");
  const [amount, setAmount] = useState("");
  const [deadlineDays, setDeadlineDays] = useState("7");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!provider || !terms || !amount) {
      warning("Please fill in all required fields");
      return;
    }

    const amountWei = BigInt(Math.floor(parseFloat(amount) * 1e18));
    const deadlineTimestamp = Math.floor(
      Date.now() / 1000 + parseInt(deadlineDays) * 86400
    );

    createPact(
      {
        provider,
        terms,
        deadlineTimestamp,
        amount: amountWei,
      },
      {
        onSuccess: () => {
          setProvider("");
          setTerms("");
          setAmount("");
          setDeadlineDays("7");
          setIsOpen(false);
        },
      }
    );
  };

  if (!isConnected) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient" size="sm">
          <Plus className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline">New Pact</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="brand-card border-2 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Create a New Pact
          </DialogTitle>
          <DialogDescription>
            Define the service terms, set the escrow amount, and specify the
            provider.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="provider">Provider Address</Label>
            <Input
              id="provider"
              placeholder="0x..."
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              disabled={isCreating}
            />
            <p className="text-xs text-muted-foreground">
              The wallet address of the service provider
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="terms">Service Terms</Label>
            <textarea
              id="terms"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
              placeholder="Describe the deliverables in detail. E.g.: Build a REST API with user authentication, documentation, and deploy to production..."
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              disabled={isCreating}
            />
            <p className="text-xs text-muted-foreground">
              AI validators will evaluate deliverables against these terms
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Escrow Amount (GEN)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isCreating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline (days)</Label>
              <Input
                id="deadline"
                type="number"
                min="1"
                max="365"
                value={deadlineDays}
                onChange={(e) => setDeadlineDays(e.target.value)}
                disabled={isCreating}
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="gradient"
            className="w-full h-12 text-lg"
            disabled={isCreating || !provider || !terms || !amount}
          >
            {isCreating ? "Creating Pact..." : "Create Pact & Lock Funds"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Funds will be locked in escrow until the pact is resolved.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
