"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

import type { SubscriptionData } from "@/lib/website-actions";

interface SubscriptionContextValue {
  subscription: SubscriptionData;
  isPremium: boolean;
}

const SubscriptionContext = createContext<
  SubscriptionContextValue | undefined
>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
  subscription: SubscriptionData;
}

export function SubscriptionProvider({
  children,
  subscription,
}: SubscriptionProviderProps) {
  const value = useMemo(
    () => ({
      subscription,
      isPremium: subscription.isPremium,
    }),
    [subscription]
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);

  if (!context) {
    throw new Error(
      "useSubscription must be used inside SubscriptionProvider"
    );
  }

  return context;
}