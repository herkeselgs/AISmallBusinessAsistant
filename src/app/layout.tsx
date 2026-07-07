import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Otto — the AI employee that never lets a lead go cold",
  description:
    "Otto answers every new lead in under 60 seconds and books the job on your calendar — 24/7. Connect your inbox and stop losing jobs to whoever replied first.",
  openGraph: {
    title: "Otto — the AI employee that never lets a lead go cold",
    description:
      "Answers every new lead in under 60 seconds and books the job on your calendar. 24/7.",
    type: "website",
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
