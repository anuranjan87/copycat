import type { ReactNode } from "react";

import { SubscriptionProvider } from "@/components/subscription-provider";
import { getSubscription } from "@/lib/website-actions";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{
    username: string;
  }>;
}

export default async function TemplatesUsernameLayout({
  children,
  params,
}: LayoutProps) {
  const { username } = await params;

  const subscription = await getSubscription(username);

  return (
    <SubscriptionProvider subscription={subscription}>
      {children}
    </SubscriptionProvider>
  );
}