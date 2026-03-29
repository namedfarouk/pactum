"use client";

import { Navbar } from "@/components/Navbar";
import { PactsTable } from "@/components/PactsTable";
import { ReputationPanel } from "@/components/ReputationPanel";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-20 pb-12 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              <span className="gradient-purple-pink bg-clip-text text-transparent">
                Pactum
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Trustless service agreements where AI validators judge if the work
              was done.
              <br />
              Lock funds in escrow. Deliver. Get paid.
            </p>
          </div>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Left Column - Pacts Table */}
            <div className="lg:col-span-8 animate-slide-up">
              <PactsTable />
            </div>

            {/* Right Column - Reputation */}
            <div
              className="lg:col-span-4 animate-slide-up"
              style={{ animationDelay: "100ms" }}
            >
              <ReputationPanel />
            </div>
          </div>

          {/* How it Works */}
          <div
            className="mt-8 brand-card p-6 md:p-8 animate-fade-in"
            style={{ animationDelay: "200ms" }}
          >
            <h2 className="text-2xl font-bold mb-4">How it Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="text-accent font-bold text-lg">
                  1. Create a Pact
                </div>
                <p className="text-sm text-muted-foreground">
                  Define service terms in natural language, set the escrow
                  amount, and specify the provider&apos;s address.
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-accent font-bold text-lg">
                  2. Deliver Work
                </div>
                <p className="text-sm text-muted-foreground">
                  The provider completes the work and submits a deliverable URL
                  (GitHub repo, deployed site, API endpoint).
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-accent font-bold text-lg">
                  3. AI Evaluation
                </div>
                <p className="text-sm text-muted-foreground">
                  GenLayer&apos;s AI validators fetch the deliverable and judge
                  whether it meets the agreed terms.
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-accent font-bold text-lg">
                  4. Get Paid
                </div>
                <p className="text-sm text-muted-foreground">
                  If fulfilled, funds are released to the provider. If not,
                  funds are returned to the client. Reputation is updated.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 py-2">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <span>Built for the GenLayer Bradbury Hackathon</span>
            <a
              href="https://genlayer.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
            >
              Powered by GenLayer
            </a>
            <a
              href="https://docs.genlayer.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
            >
              Docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
