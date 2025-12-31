import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "./QueryProvider";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "Instagram Dashboard",
  description: "Instagram Webhook Analytics Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}

