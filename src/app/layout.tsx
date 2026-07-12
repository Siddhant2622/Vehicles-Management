import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthListener } from "@/components/auth/AuthListener";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TransitOps – Smart Transport Operations Platform",
  description: "Enterprise SaaS dashboard console for logistics, fleet, maintenance, driver and trip management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} h-full antialiased font-sans`}>
        <AuthListener />
        {children}
      </body>
    </html>
  );
}
