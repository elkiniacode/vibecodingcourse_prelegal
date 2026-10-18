import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mutual NDA Creator | Prelegal",
  description: "Fill in the key terms and download a completed Common Paper Mutual NDA.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col bg-slate-50 text-slate-900 antialiased lg:h-dvh">
        {children}
      </body>
    </html>
  );
}
