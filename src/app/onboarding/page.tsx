import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OnboardingChat } from "@/components/onboarding/onboarding-chat";

// Uses JWT (same source as middleware) to avoid JWT↔DB redirect loops:
// if we read DB here and it says "completed" while JWT still says "false",
// this page redirects to /dashboard while middleware redirects back here → loop.
export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  if (session.user.onboardingCompleted) {
    redirect("/dashboard");
  }

  return <OnboardingChat />;
}
