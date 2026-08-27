import type { Metadata } from "next";
import { headers } from "next/headers";
import { Archivo } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { auth } from "@/lib/auth";
import { AssistantPanel } from "@/components/assistant/assistant-panel";
import { listMessagesForUser } from "@/lib/services/message";

const archivo = Archivo({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mentra",
  description: "Your academic life, understood.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Mounted here rather than per-page so the assistant is reachable from every
  // authenticated screen without each page having to remember to include it.
  const session = await auth.api.getSession({ headers: await headers() });

  // Read here rather than in the panel so the conversation is already on the
  // page when it opens, instead of appearing a moment later.
  const conversation = session?.user
    ? await listMessagesForUser(session.user.id)
    : [];

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${archivo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/*
          DIRECTION CONTRACT
          THESIS: your term is a score — every course a line, all read against one
          timeline — refusing the dashboard-of-cards that treats work as unordered tiles.
          OWN-WORLD: paper-and-ink neutrals (warm off-white by day, deep slate by night),
          one grotesque at many weights, hairline lane rules; indigo marks now and next,
          amber marks what has slipped, everything on track carries no colour at all.
          STORY: the student opens the term, sees where the cursor sits today, reads the
          one thing under it and why, and works.
          FIRST VIEWPORT: a collapsible margin naming each course line, a time ruler, work
          on lanes with the NOW rule crossing them, tonight's item full size beneath.
          FORM: The Score — direction 7 of 7 on the ranked list, seed key 6bf7da0b.
          FINISH: unreviewed and undocumented is unfinished; this build ends with the finish
          review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
        */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          {session?.user && (
            <AssistantPanel
              initialMessages={conversation.map((message) => ({
                role: message.role,
                content: message.content,
              }))}
            />
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
