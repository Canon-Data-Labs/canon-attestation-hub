import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Canon Attestation Hub",
  description: "ZK-ML training provenance verification on Stellar",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
