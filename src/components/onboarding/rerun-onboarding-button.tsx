"use client";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function RerunOnboardingButton() {
  const router = useRouter();
  const { update: refreshSession } = useSession();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const res = await fetch("/api/profile/reset-onboarding", { method: "POST" });
        if (res.ok) {
          // Refresh the JWT so middleware sees onboardingCompleted=false on the
          // next request — otherwise the stale `true` claim would let the user
          // through to /dashboard instead of redirecting to /onboarding.
          await refreshSession();
          router.push("/onboarding");
        } else {
          setBusy(false);
        }
      }}
    >
      Vorbește din nou cu stilistul tău
    </Button>
  );
}
