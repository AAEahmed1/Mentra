import type { Metadata } from "next";
import { headers } from "next/headers";
import { IBM_Plex_Sans, IBM_Plex_Serif, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { auth } from "@/lib/auth";
import { AssistantPanel } from "@/components/assistant/assistant-panel";

const plexSans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexSerif = IBM_Plex_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Mentra",
  description: "Your academic life, understood.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Mounted here rather than per-page so the assistant is reachable from every
  // authenticated screen without each page having to remember to include it.
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plexSans.variable} ${plexSerif.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          {session?.user && <AssistantPanel />}
        </ThemeProvider>
      </body>
    </html>
  );
}
