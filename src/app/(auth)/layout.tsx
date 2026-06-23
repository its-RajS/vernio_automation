import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login — Vernio",
  description: "Sign in to your Vernio account to manage social media creatives.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}