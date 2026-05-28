"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardAlertsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/alerts");
  }, [router]);
  return null;
}
