import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SuprAI — Autonomous AI Work Organization',
  description: 'Claude Manager orchestrating autonomous worker AI teams with page-level evidence validation.',
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
