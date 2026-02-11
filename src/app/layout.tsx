import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alphaleads — Lead Generation B2B",
  description: "Genera liste di contatti B2B targettizzati con Alphaleads",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
