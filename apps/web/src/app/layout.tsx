import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TauriProvider } from "@/providers/TauriProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VidRush — Generate Full YouTube Documentaries with AI",
  description:
    "Script → Voice → Video → Published in minutes. VidRush is an AI-powered video generation desktop app for creators.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-[#0a0a0a] antialiased`}>
        <TauriProvider>{children}</TauriProvider>
      </body>
    </html>
  );
}
