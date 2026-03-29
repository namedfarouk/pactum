"use client";

import { useState } from "react";
import { useWallet } from "@/lib/genlayer/wallet";
import { useAllPacts } from "@/lib/hooks/usePactum";
import { Badge } from "./ui/badge";
import { AddressDisplay } from "./AddressDisplay";
import { PactActions } from "./PactActions";
import type { Pact, PactStatus } from "@/lib/contracts/types";

const statusColors: Record<PactStatus, string> = {
  active: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  submitted: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  approved: "bg-green-500/20 text-green-400 border-green-500/30",
  disputed: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  resolved: "bg-accent/20 text-accent border-accent/30",
  expired: "bg-red-500/20 text-red-400 border-red-500/30",
};

type FilterTab = "all" | "active" | "submitted" | "resolved" | "mine";

export function PactsTable() {
  const { data: pacts = [], isLoading } = useAllPacts();
  const { address } = useWallet();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const filteredPacts = pacts.filter((pact) => {
    switch (activeTab) {
      case "active":
        return pact.status === "active";
      case "submitted":
        return pact.status === "submitted";
      case "resolved":
        return (
          pact.status === "resolved" ||
          pact.status === "approved" ||
          pact.status === "expired"
        );
      case "mine":
        return (
          address &&
          (pact.client.toLowerCase() === address.toLowerCase() ||
            pact.provider.toLowerCase() === address.toLowerCase())
        );
      default:
        return true;
    }
  });

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "submitted", label: "Submitted" },
    { key: "resolved", label: "Resolved" },
    { key: "mine", label: "My Pacts" },
  ];

  return (
    <div className="brand-card p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold">Service Agreements</h2>
        <div className="flex gap-2 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === tab.key
                  ? "gradient-purple-pink text-white"
                  : "bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground mt-2 text-sm">
            Loading pacts...
          </p>
        </div>
      ) : filteredPacts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No pacts found.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create a new pact to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPacts.map((pact) => (
            <PactCard key={pact.id} pact={pact} currentAddress={address} />
          ))}
        </div>
      )}
    </div>
  );
}

function PactCard({
  pact,
  currentAddress,
}: {
  pact: Pact;
  currentAddress: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const isClient =
    currentAddress &&
    pact.client.toLowerCase() === currentAddress.toLowerCase();
  const isProvider =
    currentAddress &&
    pact.provider.toLowerCase() === currentAddress.toLowerCase();

  return (
    <div
      className="brand-card brand-card-hover p-4 cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Pact ID & Status */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-mono text-muted-foreground shrink-0">
            #{pact.id}
          </span>
          <Badge className={`${statusColors[pact.status]} border`}>
            {pact.status}
          </Badge>
          {isClient && (
            <Badge className="bg-accent/10 text-accent border-accent/20 border">
              Client
            </Badge>
          )}
          {isProvider && (
            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 border">
              Provider
            </Badge>
          )}
        </div>

        {/* Amount & Addresses */}
        <div className="flex items-center gap-4 ml-auto text-sm">
          <span className="font-bold text-accent">
            {(pact.amount / 1e18).toFixed(2)} GEN
          </span>
          <div className="hidden md:flex items-center gap-2 text-muted-foreground">
            <span>Client:</span>
            <AddressDisplay address={pact.client} maxLength={8} />
            <span className="mx-1">&rarr;</span>
            <span>Provider:</span>
            <AddressDisplay address={pact.provider} maxLength={8} />
          </div>
        </div>
      </div>

      {/* Terms Preview */}
      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
        {pact.terms}
      </p>

      {/* Expanded Details */}
      {expanded && (
        <div
          className="mt-4 pt-4 border-t border-white/10 space-y-3"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Full Terms</p>
              <p className="text-foreground whitespace-pre-wrap">
                {pact.terms}
              </p>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-muted-foreground">Client</p>
                <code className="text-xs font-mono break-all">
                  {pact.client}
                </code>
              </div>
              <div>
                <p className="text-muted-foreground">Provider</p>
                <code className="text-xs font-mono break-all">
                  {pact.provider}
                </code>
              </div>
              {pact.deliverable_url && (
                <div>
                  <p className="text-muted-foreground">Deliverable URL</p>
                  <a
                    href={pact.deliverable_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline text-xs break-all"
                  >
                    {pact.deliverable_url}
                  </a>
                </div>
              )}
              {pact.submission_note && (
                <div>
                  <p className="text-muted-foreground">Provider Note</p>
                  <p className="text-foreground text-xs">
                    {pact.submission_note}
                  </p>
                </div>
              )}
              {pact.deadline_timestamp > 0 && (
                <div>
                  <p className="text-muted-foreground">Deadline</p>
                  <p className="text-foreground text-xs">
                    {new Date(pact.deadline_timestamp * 1000).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <PactActions
            pact={pact}
            isClient={!!isClient}
            isProvider={!!isProvider}
          />
        </div>
      )}
    </div>
  );
}
