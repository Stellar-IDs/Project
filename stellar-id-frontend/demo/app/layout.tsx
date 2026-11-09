import type { Metadata } from "next";
import "./demo.css";

export const metadata: Metadata = {
  title: "Stellar Identity Demo",
  description: "Demo app for the Stellar Identity & Authentication Suite (testnet only)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
