import type { Metadata } from "next";
import { Archivo, Bitter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { getSession } from "@/lib/session";
import { AssistantPanel } from "@/components/assistant/assistant-panel";
import { ThreadSeed } from "@/components/assistant/thread-seed";
import { listMessagesForConversation } from "@/lib/services/message";
import { latestConversationForUser } from "@/lib/services/conversation";

// The running text, every label and every figure. A workhorse grotesque that
// stays quiet at 11px and holds a table together.
const archivo = Archivo({
  variable: "--font-sans",
  subsets: ["latin"],
});

// The display voice. A slab with the weight of a printed timetable — it is
// what makes a heading read as struck rather than typed.
const bitter = Bitter({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Mentra",
  description: "Your academic life, understood.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Mounted here rather than per-page so the assistant is reachable from every
  // authenticated screen without each page having to remember to include it.
  const session = await getSession();

  // Read here rather than in the panel so the conversation is already on the
  // page when it opens, instead of appearing a moment later. The panel carries
  // on the most recent thread; a new one is started from the chats page.
  const conversation = session?.user
    ? await latestConversationForUser(session.user.id)
    : null;
  const history =
    session?.user && conversation
      ? await listMessagesForConversation(session.user.id, conversation.id)
      : [];

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${archivo.variable} ${bitter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/*
          DIRECTION CONTRACT
          THESIS: a term is an almanac — a printed table of what falls due when, read down
          a column, with today's entry set in the largest type on the page. Mentra prints
          the student's edition and re-prints it every morning.
          OWN-WORLD: almanac stock with a green cast (bookcloth by night) and two plates —
          thicket green for what is live now, oxblood for what has slipped. Thick-thin rule
          pairs open every region, tables are banded and fixed-column, ink owns whole bands
          rather than scattering as accents, and overlapping marks overprint.
          STORY: the student opens the edition, reads today's entry off a solid band, sees
          the term's whole table beneath it, and works.
          FIRST VIEWPORT: a dateline masthead over a double rule, the term table with today's
          mark crossing every line, today's entry banded beneath it, then the ranked table.
          FORM: The Almanac — user-pinned direction, seed key 9e7493f4 (assignment superseded
          by the pin). Raised by the hands it beat: board discipline from the split-flap
          concourse (fixed columns, a lamp column, state inside the grid), palette commitment
          from Studio Dumbar (ink owns regions, not accents), overprint from the WPA sheet.
          FINISH: unreviewed and undocumented is unfinished; this build ends with the finish
          review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
        */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          {session?.user && (
            <>
              {/*
                Only when nothing is open yet: a chat page seeds the thread it
                is showing, and the most recent one must not overwrite it.
              */}
              <ThreadSeed
                onlyIfEmpty
                conversationId={conversation?.id ?? null}
                messages={history.map((message) => ({
                  role: message.role,
                  content: message.content,
                }))}
              />
              <AssistantPanel />
            </>
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
