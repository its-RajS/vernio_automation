import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardLayoutClient } from "@/components/dashboard-layout-client";

export const metadata: Metadata = {
  title: "Dashboard — Vernio",
  description: "Manage your social media creative projects.",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardLayoutClient email={user.email ?? ""}>
      {children}
    </DashboardLayoutClient>
  );
}
