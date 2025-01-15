import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// In _app.tsx or layout.tsx

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Meal Planner",
  description: "Track and plan your daily meals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
