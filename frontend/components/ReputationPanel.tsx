"use client";

import { useState } from "react";
import { useReputation } from "@/lib/hooks/usePactum";
import { useWallet } from "@/lib/genlayer/wallet";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { AddressDisplay } from "./AddressDisplay";

export function ReputationPanel() {
  const { address } = useWallet();
  const [lookupAddress, setLookupAddress] = useState("");
  const targetAddress = lookupAddress || address;

  const { data: reputation, isLoading } = useReputation(targetAddress);

  const totalPacts =
    (reputation?.completed || 0) +
    (reputation?.failed || 0) +
    (reputation?.disputed || 0);
  const successRate =
    totalPacts > 0
      ? Math.round(((reputation?.completed || 0) / totalPacts) * 100)
      : 0;

  return (
    <div className="brand-card p-6">
      <h2 className="text-2xl font-bold mb-4">Reputation</h2>

      {/* Lookup */}
      <div className="flex gap-2 mb-6">
        <Input
          placeholder="Look up any address..."
          value={lookupAddress}
          onChange={(e) => setLookupAddress(e.target.value)}
          className="text-xs"
        />
        {lookupAddress && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLookupAddress("")}
          >
            Clear
          </Button>
        )}
      </div>

      {targetAddress ? (
        <>
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-1">Viewing</p>
            <AddressDisplay
              address={targetAddress}
              maxLength={16}
              showCopy
              className="text-sm"
            />
          </div>

          {isLoading ? (
            <div className="text-center py-6">
              <div className="inline-block w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Success Rate Circle */}
              <div className="flex items-center justify-center">
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="oklch(0.25 0.08 265)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="oklch(0.65 0.22 300)"
                      strokeWidth="8"
                      strokeDasharray={`${successRate * 2.51} 251`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold">{successRate}%</span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="brand-card p-3 text-center">
                  <p className="text-2xl font-bold text-green-400">
                    {reputation?.completed || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div className="brand-card p-3 text-center">
                  <p className="text-2xl font-bold text-red-400">
                    {reputation?.failed || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
                <div className="brand-card p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-400">
                    {reputation?.disputed || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Disputed</p>
                </div>
                <div className="brand-card p-3 text-center">
                  <p className="text-2xl font-bold text-accent">
                    {reputation?.total_earned || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Earned (GEN)</p>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-6 text-muted-foreground text-sm">
          Connect your wallet or search an address to view reputation.
        </div>
      )}
    </div>
  );
}
