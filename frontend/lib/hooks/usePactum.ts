"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import PactumContract from "../contracts/Pactum";
import { getContractAddress, getStudioUrl } from "../genlayer/client";
import { useWallet } from "../genlayer/wallet";
import { success, error, configError } from "../utils/toast";
import type { Pact, AgentReputation } from "../contracts/types";

/**
 * Hook to get the Pactum contract instance
 */
export function usePactumContract(): PactumContract | null {
  const { address } = useWallet();
  const contractAddress = getContractAddress();
  const studioUrl = getStudioUrl();

  const contract = useMemo(() => {
    if (!contractAddress) {
      configError(
        "Setup Required",
        "Contract address not configured. Please set NEXT_PUBLIC_CONTRACT_ADDRESS in your .env file.",
        {
          label: "Setup Guide",
          onClick: () => window.open("/docs/setup", "_blank"),
        }
      );
      return null;
    }
    return new PactumContract(contractAddress, address, studioUrl);
  }, [contractAddress, address, studioUrl]);

  return contract;
}

/**
 * Hook to fetch all pacts
 */
export function useAllPacts() {
  const contract = usePactumContract();

  return useQuery<Pact[], Error>({
    queryKey: ["allPacts"],
    queryFn: () => {
      if (!contract) return Promise.resolve([]);
      return contract.getAllPacts();
    },
    refetchOnWindowFocus: true,
    staleTime: 2000,
    enabled: !!contract,
  });
}

/**
 * Hook to fetch active pacts
 */
export function useActivePacts() {
  const contract = usePactumContract();

  return useQuery<Pact[], Error>({
    queryKey: ["activePacts"],
    queryFn: () => {
      if (!contract) return Promise.resolve([]);
      return contract.getActivePacts();
    },
    refetchOnWindowFocus: true,
    staleTime: 2000,
    enabled: !!contract,
  });
}

/**
 * Hook to fetch a single pact
 */
export function usePact(pactId: number | null) {
  const contract = usePactumContract();

  return useQuery<Pact | null, Error>({
    queryKey: ["pact", pactId],
    queryFn: () => {
      if (!contract || pactId === null) return Promise.resolve(null);
      return contract.getPact(pactId);
    },
    refetchOnWindowFocus: true,
    staleTime: 2000,
    enabled: !!contract && pactId !== null,
  });
}

/**
 * Hook to fetch reputation for an address
 */
export function useReputation(agent: string | null) {
  const contract = usePactumContract();

  return useQuery<AgentReputation, Error>({
    queryKey: ["reputation", agent],
    queryFn: () => {
      if (!contract || !agent)
        return Promise.resolve({
          completed: 0,
          disputed: 0,
          failed: 0,
          total_earned: 0,
        });
      return contract.getReputation(agent);
    },
    refetchOnWindowFocus: true,
    staleTime: 2000,
    enabled: !!contract && !!agent,
  });
}

/**
 * Hook to fetch pact count
 */
export function usePactCount() {
  const contract = usePactumContract();

  return useQuery<number, Error>({
    queryKey: ["pactCount"],
    queryFn: () => {
      if (!contract) return Promise.resolve(0);
      return contract.getPactCount();
    },
    refetchOnWindowFocus: true,
    staleTime: 2000,
    enabled: !!contract,
  });
}

/**
 * Hook to create a new pact
 */
export function useCreatePact() {
  const contract = usePactumContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const mutation = useMutation({
    mutationFn: async ({
      provider,
      terms,
      deadlineTimestamp,
      amount,
    }: {
      provider: string;
      terms: string;
      deadlineTimestamp: number;
      amount: bigint;
    }) => {
      if (!contract) {
        throw new Error(
          "Contract not configured. Please set NEXT_PUBLIC_CONTRACT_ADDRESS."
        );
      }
      if (!address) {
        throw new Error("Wallet not connected.");
      }
      setIsCreating(true);
      return contract.createPact(provider, terms, deadlineTimestamp, amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allPacts"] });
      queryClient.invalidateQueries({ queryKey: ["activePacts"] });
      queryClient.invalidateQueries({ queryKey: ["pactCount"] });
      setIsCreating(false);
      success("Pact created successfully!", {
        description: "Funds have been escrowed in the contract.",
      });
    },
    onError: (err: any) => {
      setIsCreating(false);
      error("Failed to create pact", {
        description: err?.message || "Please try again.",
      });
    },
  });

  return {
    ...mutation,
    isCreating,
    createPact: mutation.mutate,
    createPactAsync: mutation.mutateAsync,
  };
}

/**
 * Hook to submit a deliverable
 */
export function useSubmitDeliverable() {
  const contract = usePactumContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mutation = useMutation({
    mutationFn: async ({
      pactId,
      deliverableUrl,
      note,
    }: {
      pactId: number;
      deliverableUrl: string;
      note: string;
    }) => {
      if (!contract) throw new Error("Contract not configured.");
      if (!address) throw new Error("Wallet not connected.");
      setIsSubmitting(true);
      return contract.submitDeliverable(pactId, deliverableUrl, note);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allPacts"] });
      queryClient.invalidateQueries({ queryKey: ["activePacts"] });
      setIsSubmitting(false);
      success("Deliverable submitted!", {
        description: "The client can now review or trigger AI evaluation.",
      });
    },
    onError: (err: any) => {
      setIsSubmitting(false);
      error("Failed to submit deliverable", {
        description: err?.message || "Please try again.",
      });
    },
  });

  return {
    ...mutation,
    isSubmitting,
    submitDeliverable: mutation.mutate,
  };
}

/**
 * Hook to approve a deliverable
 */
export function useApproveDeliverable() {
  const contract = usePactumContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [isApproving, setIsApproving] = useState(false);

  const mutation = useMutation({
    mutationFn: async (pactId: number) => {
      if (!contract) throw new Error("Contract not configured.");
      if (!address) throw new Error("Wallet not connected.");
      setIsApproving(true);
      return contract.approveDeliverable(pactId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allPacts"] });
      queryClient.invalidateQueries({ queryKey: ["activePacts"] });
      queryClient.invalidateQueries({ queryKey: ["reputation"] });
      setIsApproving(false);
      success("Deliverable approved!", {
        description: "Funds have been released to the provider.",
      });
    },
    onError: (err: any) => {
      setIsApproving(false);
      error("Failed to approve deliverable", {
        description: err?.message || "Please try again.",
      });
    },
  });

  return {
    ...mutation,
    isApproving,
    approveDeliverable: mutation.mutate,
  };
}

/**
 * Hook to trigger AI evaluation
 */
export function useEvaluateDeliverable() {
  const contract = usePactumContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [isEvaluating, setIsEvaluating] = useState(false);

  const mutation = useMutation({
    mutationFn: async (pactId: number) => {
      if (!contract) throw new Error("Contract not configured.");
      if (!address) throw new Error("Wallet not connected.");
      setIsEvaluating(true);
      return contract.evaluateDeliverable(pactId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allPacts"] });
      queryClient.invalidateQueries({ queryKey: ["activePacts"] });
      queryClient.invalidateQueries({ queryKey: ["reputation"] });
      setIsEvaluating(false);
      success("AI evaluation complete!", {
        description:
          "The deliverable has been evaluated and funds distributed.",
      });
    },
    onError: (err: any) => {
      setIsEvaluating(false);
      error("AI evaluation failed", {
        description: err?.message || "Please try again.",
      });
    },
  });

  return {
    ...mutation,
    isEvaluating,
    evaluateDeliverable: mutation.mutate,
  };
}

/**
 * Hook to cancel a pact
 */
export function useCancelPact() {
  const contract = usePactumContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [isCancelling, setIsCancelling] = useState(false);

  const mutation = useMutation({
    mutationFn: async (pactId: number) => {
      if (!contract) throw new Error("Contract not configured.");
      if (!address) throw new Error("Wallet not connected.");
      setIsCancelling(true);
      return contract.cancelPact(pactId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allPacts"] });
      queryClient.invalidateQueries({ queryKey: ["activePacts"] });
      queryClient.invalidateQueries({ queryKey: ["pactCount"] });
      setIsCancelling(false);
      success("Pact cancelled", {
        description: "Escrowed funds have been returned.",
      });
    },
    onError: (err: any) => {
      setIsCancelling(false);
      error("Failed to cancel pact", {
        description: err?.message || "Please try again.",
      });
    },
  });

  return {
    ...mutation,
    isCancelling,
    cancelPact: mutation.mutate,
  };
}
