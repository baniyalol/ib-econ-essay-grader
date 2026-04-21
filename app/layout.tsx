import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IB Economics Essay Grader — 10-mark",
  description:
    "Rubric-driven AI grader for IB Economics Paper 1 Part (b) 10-mark essays.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
