import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = "https://folvra.com";
const TITLE = "Folvra — follow up with every lead before it goes cold";
const DESCRIPTION =
  "Folvra is the AI employee that follows up with every lead. It replies to new leads in under 60 seconds, collects the job details, follows up until they respond, and helps you book the estimate. 24/7.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Folvra",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
