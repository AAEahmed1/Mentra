/* Hallmark · macrostructure: Workbench · tone: austere editorial · anchor hue: thicket green (oklch 158)
 * nav: N6 masthead · footer: Ft4 colophon · theme: DESIGN.md (Mentra almanac, locked)
 * enrichment: none — the product itself is printed live in place of screenshots
 * pre-emit critique: P5 H4 E4 S5 R5 V4
 */
import Link from "next/link";

import { RunningHead } from "@/components/running-head";
import { ThemeToggle } from "@/components/theme-toggle";
import { DurationBar } from "@/components/duration-bar";
import { StateLamp } from "@/components/state-lamp";
import { SampleEdition } from "@/components/landing/sample-edition";

/**
 * The front matter of the edition: what a visitor reads before signing in.
 *
 * It is set as every signed-in page is set — one column on the same stock,
 * regions opened by running heads, every list a table — because the page
 * explaining the product should look like the product. There is no index,
 * since there is nothing to navigate to yet; the masthead carries the way in.
 *
 * The centrepiece is not a screenshot. The example term, today's entry and
 * the ranked table are the real components, fed example work dated from
 * today, so what a visitor sees is what a student gets.
 */

const dayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

const CTA_PRIMARY =
  "rounded-xs bg-primary px-3.5 py-2 text-sm font-medium whitespace-nowrap text-primary-foreground transition-colors hover:bg-primary/85 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

const CTA_SECONDARY =
  "rounded-xs border border-rule-strong px-3.5 py-2 text-sm whitespace-nowrap transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

/** The words a table's first column carries when it explains a mark. */
function Reads({
  children,
  meaning,
}: {
  children: React.ReactNode;
  meaning: string;
}) {
  return (
    <td className="pr-4 text-sm">
      {children}
      <span className="mt-0.5 block text-xs text-muted-foreground sm:hidden">
        {meaning}
      </span>
    </td>
  );
}

function Meaning({ children }: { children: React.ReactNode }) {
  return (
    <td className="hidden pr-4 text-sm text-muted-foreground sm:table-cell">
      {children}
    </td>
  );
}

export function LandingPage({
  now,
  googleSignIn,
}: {
  now: Date;
  /** Whether Google sign-in is configured, so the page promises only what's there. */
  googleSignIn: boolean;
}) {
  // Clipped on the x axis only: the term table's hover cards are laid out even
  // while invisible, and at exactly the medium breakpoint one can reach a few
  // pixels past the viewport and give the page a sideways scroll.
  return (
    <div className="mx-auto flex max-w-4xl flex-col overflow-x-clip px-6 pb-16">
      <header>
        {/* The way in. Two destinations, and the edition's own theme toggle. */}
        <div className="flex items-center justify-between gap-4 py-4">
          <span className="font-display text-lg font-semibold tracking-[-0.01em]">
            Mentra
          </span>
          <nav aria-label="Account" className="flex items-center gap-2">
            <Link
              href="/sign-in"
              className="hidden rounded-lg px-2.5 py-1.5 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:inline-flex"
            >
              Sign in
            </Link>
            <Link href="/sign-up" className={CTA_PRIMARY}>
              Create account
            </Link>
            <ThemeToggle />
          </nav>
        </div>

        {/* The masthead: the same object every signed-in page opens with — a
            title in the slab, a dateline, the thick-thin rule closing it. */}
        <div className="pt-10 pb-6 md:pt-14">
          <h1 className="font-display max-w-[22ch] text-[2rem] leading-[1.12] font-semibold tracking-[-0.02em] text-balance sm:text-[2.375rem]">
            What to work on tonight, and why.
          </h1>
          <p className="mt-3 max-w-[62ch] text-sm text-muted-foreground">
            Mentra keeps a student&apos;s courses, deadlines and notes in one
            place and prints one page from them: the piece of work that matters
            most right now, ranked by your own dates and estimates, with the
            reason written underneath. Ask it why, and it answers from your
            records rather than a guess.
          </p>
          <p
            data-figures
            className="mt-3 text-xs text-muted-foreground"
          >
            <time dateTime={now.toISOString().slice(0, 10)}>
              {dayFormatter.format(now)}
            </time>
            {" · "}
            Your academic life, understood.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Link href="/sign-up" className={CTA_PRIMARY}>
              Start your first term
            </Link>
            <Link href="/sign-in" className={CTA_SECONDARY}>
              Sign in
            </Link>
            <span className="ml-1 text-xs text-muted-foreground">
              {googleSignIn
                ? "Email and password, or Google."
                : "An email address and a password."}
            </span>
          </div>
        </div>
        <div
          aria-hidden="true"
          className="animate-rule-draw h-1 origin-left bg-[linear-gradient(to_bottom,var(--rule-strong)_0_2px,transparent_2px_100%),linear-gradient(to_bottom,transparent_0_3px,var(--rule)_3px_4px)]"
        />
      </header>

      <main className="flex flex-col gap-14 pt-10 md:pt-12">
        {/* THE EDITION. The product, printed, before any explanation of it. */}
        <SampleEdition now={now} />

        {/* KEY. An almanac carries a key to its marks; so does this one. */}
        <section aria-labelledby="key-heading" className="flex flex-col gap-4">
          <RunningHead id="key-heading">Key to the marks</RunningHead>
          <p className="max-w-[65ch] text-sm text-muted-foreground">
            Two inks and a rule. Green is what is live, oxblood is what has
            slipped, and everything on track is plain. Every state a colour
            marks is also stated in words, so the page reads the same with the
            colour taken out.
          </p>
          <table className="almanac-table">
            <thead>
              <tr>
                <th scope="col" className="w-28 sm:w-36">
                  Mark
                </th>
                <th scope="col">Reads as</th>
                <th scope="col" className="hidden sm:table-cell">
                  What it means
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="pr-4">
                  <span
                    aria-hidden="true"
                    className="block h-6 w-0.5 bg-now"
                  />
                </td>
                <Reads meaning="One rule crosses every course at once, so two deadlines landing on the same afternoon are visible a fortnight out.">
                  Today
                </Reads>
                <Meaning>
                  One rule crosses every course at once, so two deadlines
                  landing on the same afternoon are visible a fortnight out.
                </Meaning>
              </tr>
              <tr>
                <td className="pr-4">
                  <span
                    aria-hidden="true"
                    className="block h-[22px] w-20 rounded-xs border border-rule-strong bg-[color-mix(in_oklab,var(--foreground)_24%,transparent)]"
                  />
                </td>
                <Reads meaning="An entry sits on the day it is due and is drawn as long as you said it would take. Two hours is twice the length of one.">
                  Due date and estimate
                </Reads>
                <Meaning>
                  An entry sits on the day it is due and is drawn as long as
                  you said it would take. Two hours is twice the length of one.
                </Meaning>
              </tr>
              <tr>
                <td className="pr-4">
                  <span
                    aria-hidden="true"
                    className="block h-[22px] w-10 rounded-xs bg-plate-over"
                  />
                </td>
                <Reads meaning="Counted in whole days over and stated in words, never sounded as an alarm. What slipped longest ranks first.">
                  Slipped
                </Reads>
                <Meaning>
                  Counted in whole days over and stated in words, never sounded
                  as an alarm. What slipped longest ranks first.
                </Meaning>
              </tr>
              <tr>
                <td className="pr-4">
                  <span
                    aria-hidden="true"
                    className="block h-[22px] w-14 rounded-xs bg-plate-now"
                  />
                </td>
                <Reads meaning="Live now. The band over today's entry prints in this plate until the day is out.">
                  Due today
                </Reads>
                <Meaning>
                  Live now. The band over today&apos;s entry prints in this
                  plate until the day is out.
                </Meaning>
              </tr>
              <tr>
                <td className="pr-4">
                  <StateLamp state="on-track" />
                </td>
                <Reads meaning="Work that needs nothing from you carries no ink. The lamp column at the head of a ranked table lets you find what slipped by running a finger down the edge.">
                  On track
                </Reads>
                <Meaning>
                  Work that needs nothing from you carries no ink. The lamp
                  column at the head of a ranked table lets you find what
                  slipped by running a finger down the edge.
                </Meaning>
              </tr>
              <tr>
                <td className="pr-4">
                  <DurationBar minutes={120} />
                </td>
                <Reads meaning="Printed as a length against one fixed scale, so estimates compare down a column at a glance. The figure stays beside it.">
                  Your estimate
                </Reads>
                <Meaning>
                  Printed as a length against one fixed scale, so estimates
                  compare down a column at a glance. The figure stays beside
                  it.
                </Meaning>
              </tr>
              <tr>
                <td className="pr-4">
                  <span
                    aria-hidden="true"
                    className="inline-flex items-center border border-rule-strong text-[0.6875rem]"
                  >
                    <span className="px-1.5 py-0.5 text-muted-foreground">
                      Any
                    </span>
                    <span className="border-l border-rule-strong bg-plate-now px-1.5 py-0.5 font-semibold text-plate-now-ink">
                      30m
                    </span>
                    <span className="border-l border-rule-strong px-1.5 py-0.5 text-muted-foreground">
                      1h
                    </span>
                  </span>
                </td>
                <Reads meaning="Say how long you have and work that fits moves up within its rank. Longer work is pushed down, never hidden.">
                  Time you have
                </Reads>
                <Meaning>
                  Say how long you have and work that fits moves up within its
                  rank. Longer work is pushed down, never hidden.
                </Meaning>
              </tr>
            </tbody>
          </table>
        </section>

        {/* RANKING. The rules, in the order they are applied. */}
        <section
          aria-labelledby="ranking-heading"
          className="flex flex-col gap-4"
        >
          <RunningHead id="ranking-heading">What ranks first</RunningHead>
          <p className="max-w-[65ch] text-sm text-muted-foreground">
            The ranking is arithmetic, not a model. The same courses and dates
            print the same page every time, and the sentence under today&apos;s
            entry is built from the very numbers that ranked it. A reason that
            cannot be written in one line is not used.
          </p>
          <table className="almanac-table">
            <thead>
              <tr>
                <th scope="col" className="w-10">
                  <span className="sr-only">Order</span>
                </th>
                <th scope="col">Rule</th>
                <th scope="col" className="hidden sm:table-cell">
                  How the reason reads
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td data-figures className="pr-4 text-sm text-muted-foreground">
                  1
                </td>
                <Reads meaning="“it’s 4 days overdue”">
                  Work that has slipped, longest over first
                </Reads>
                <Meaning>“it&apos;s 4 days overdue”</Meaning>
              </tr>
              <tr>
                <td data-figures className="pr-4 text-sm text-muted-foreground">
                  2
                </td>
                <Reads meaning="“it’s due tomorrow”">
                  Due within the next three days
                </Reads>
                <Meaning>“it&apos;s due tomorrow”</Meaning>
              </tr>
              <tr>
                <td data-figures className="pr-4 text-sm text-muted-foreground">
                  3
                </td>
                <Reads meaning="“the 90 min estimate is longer than the time you have”">
                  Fits the time you said you have
                </Reads>
                <Meaning>
                  “the 90 min estimate is longer than the time you have”
                </Meaning>
              </tr>
              <tr>
                <td data-figures className="pr-4 text-sm text-muted-foreground">
                  4
                </td>
                <Reads meaning="“you marked it high priority”">
                  The priority you set
                </Reads>
                <Meaning>“you marked it high priority”</Meaning>
              </tr>
              <tr>
                <td data-figures className="pr-4 text-sm text-muted-foreground">
                  5
                </td>
                <Reads meaning="“it’s due in 6 days”">The earlier deadline</Reads>
                <Meaning>“it&apos;s due in 6 days”</Meaning>
              </tr>
            </tbody>
          </table>
          <p className="max-w-[65ch] text-sm text-muted-foreground">
            Priority only orders work within a rank. A low-priority worksheet
            due tomorrow still comes before a high-priority essay due in three
            weeks, which is the order a student actually wants.
          </p>
        </section>

        {/* THE ASSISTANT. What it reads, what it files, what it will not do. */}
        <section aria-labelledby="ask-heading" className="flex flex-col gap-4">
          <RunningHead id="ask-heading">Ask Mentra</RunningHead>
          <div className="flex max-w-[65ch] flex-col gap-3 text-sm text-muted-foreground">
            <p>
              A chat panel on every page. Before it answers, it reads your
              courses, your work, your notes and what it has learned about you.
              Every deadline it states comes from a lookup. If it does not
              know, it says so.
            </p>
            <p>
              It files as well as reads. Mention an essay due Friday and it is
              on your work list before the sentence is over, with what you said
              and nothing invented. It asks before it changes or removes
              anything you already have.
            </p>
          </div>

          <ul className="flex max-w-[70ch] flex-col gap-4 border-y border-rule py-5">
            <li className="flex flex-col items-end gap-1">
              <span className="text-[0.6875rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                You
              </span>
              <p className="max-w-[85%] rounded-xs bg-muted px-3 py-2 text-sm">
                I&apos;ve got 45 minutes before studio. What&apos;s worth
                starting?
              </p>
            </li>
            <li className="flex flex-col gap-1">
              <span className="text-[0.6875rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                Mentra
              </span>
              <p className="max-w-[85%] text-sm">
                Structures problem set 4 is still first: it&apos;s 2 days over.
                At 90 minutes it won&apos;t fit in 45, so if you want something
                you can finish, Reading: Rossi, chapter 2 is 45 minutes and due
                in 14 days. Otherwise start the problem set and stop when you
                have to leave.
              </p>
            </li>
            <li className="flex flex-col items-end gap-1">
              <span className="text-[0.6875rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                You
              </span>
              <p className="max-w-[85%] rounded-xs bg-muted px-3 py-2 text-sm">
                The reading took an hour and a half last time, not 45.
              </p>
            </li>
            <li className="flex flex-col gap-1">
              <span className="text-[0.6875rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                Mentra
              </span>
              <p className="max-w-[85%] text-sm">
                The estimate on the reading is now 90 minutes. I&apos;ve also
                recorded that your reading estimates run short, marked as
                something I inferred, so you can correct it on the What Mentra
                knows page.
              </p>
            </li>
          </ul>
          <p className="max-w-[65ch] text-xs text-muted-foreground">
            An example exchange, written by hand. Real answers are looked up in
            your own records.
          </p>

          <table className="almanac-table mt-2">
            <thead>
              <tr>
                <th scope="col" className="w-24">
                  <span className="sr-only">Action</span>
                </th>
                <th scope="col">Its reach</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="pr-4 text-sm">Read</td>
                <td className="text-sm text-muted-foreground">
                  Your courses and terms. Your work, already ranked, with the
                  reason for each place. Your notes, by keyword or by the work
                  they are filed against. Everything it remembers about you.
                </td>
              </tr>
              <tr>
                <td className="pr-4 text-sm">File</td>
                <td className="text-sm text-muted-foreground">
                  Work, with whatever detail you gave and no more. Notes,
                  against a course or a piece of work. Courses into a term.
                  Terms. What it has learned about you, marked as said or
                  inferred.
                </td>
              </tr>
              <tr>
                <td className="pr-4 text-sm">Never</td>
                <td className="text-sm text-muted-foreground">
                  Delete a course or a term. Forget a memory. Invent a date or
                  a grade. Reach another student&apos;s records: who you are is
                  fixed by your session, not by anything it can say.
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* MEMORY. What it keeps, in plain language, and how to take it back. */}
        <section
          aria-labelledby="memory-heading"
          className="flex flex-col gap-4"
        >
          <RunningHead id="memory-heading">What Mentra knows</RunningHead>
          <p className="max-w-[65ch] text-sm text-muted-foreground">
            As you work with the assistant it records what is durable about
            you: what you study, what you have committed to, what you find
            hard, how you tend to work. Every line is on one page, in plain
            language, and each says whether you told it or it noticed.
          </p>
          <table className="almanac-table">
            <thead>
              <tr>
                <th scope="col">Recorded</th>
                <th scope="col" className="hidden w-32 sm:table-cell">
                  Kind
                </th>
                <th scope="col" className="w-24 text-right sm:w-28">
                  Source
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Reads meaning="Profile">Studying architecture, second year.</Reads>
                <Meaning>Profile</Meaning>
                <td className="text-right text-xs text-muted-foreground">
                  You said so
                </td>
              </tr>
              <tr>
                <Reads meaning="Commitment">
                  Studio runs Tuesday and Thursday afternoons.
                </Reads>
                <Meaning>Commitment</Meaning>
                <td className="text-right text-xs text-muted-foreground">
                  You said so
                </td>
              </tr>
              <tr>
                <Reads meaning="Learning state">
                  Finds structures problem sets slower than studio work.
                </Reads>
                <Meaning>Learning state</Meaning>
                <td className="text-right text-xs text-muted-foreground">
                  Inferred
                </td>
              </tr>
              <tr>
                <Reads meaning="Behavioural">
                  Estimates for reading run short.
                </Reads>
                <Meaning>Behavioural</Meaning>
                <td className="text-right text-xs text-muted-foreground">
                  Inferred
                </td>
              </tr>
            </tbody>
          </table>
          <p className="max-w-[65ch] text-sm text-muted-foreground">
            Anything wrong can be forgotten with one press, and deleting your
            account removes everything with it. Error reports leave the app
            with your own words stripped out first.
          </p>
        </section>

        {/* THE WAY IN. What signing up actually involves, and what it doesn't. */}
        <section
          aria-labelledby="start-heading"
          className="flex flex-col gap-4"
        >
          <RunningHead id="start-heading">How it starts</RunningHead>
          <p className="max-w-[65ch] text-sm text-muted-foreground">
            Two things are required: a way to sign in, and one piece of work
            with a date. The page prints from that and sharpens as you add to
            it.
          </p>
          <table className="almanac-table">
            <thead>
              <tr>
                <th scope="col" className="w-10">
                  <span className="sr-only">Number</span>
                </th>
                <th scope="col">Step</th>
                <th scope="col" className="hidden sm:table-cell">
                  What it involves
                </th>
                <th scope="col" className="w-20 text-right sm:w-24">
                  Skippable
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td data-figures className="pr-4 text-sm text-muted-foreground">
                  1
                </td>
                <Reads
                  meaning={
                    googleSignIn
                      ? "An email address and a password, or a Google account."
                      : "An email address and a password."
                  }
                >
                  Create an account
                </Reads>
                <Meaning>
                  {googleSignIn
                    ? "An email address and a password, or a Google account."
                    : "An email address and a password."}
                </Meaning>
                <td className="text-right text-sm">No</td>
              </tr>
              <tr>
                <td data-figures className="pr-4 text-sm text-muted-foreground">
                  2
                </td>
                <Reads meaning="Program and institution. Any field; nothing in Mentra assumes one.">
                  Say what you study
                </Reads>
                <Meaning>
                  Program and institution. Any field; nothing in Mentra assumes
                  one.
                </Meaning>
                <td className="text-right text-sm">Yes</td>
              </tr>
              <tr>
                <td data-figures className="pr-4 text-sm text-muted-foreground">
                  3
                </td>
                <Reads meaning="A term with its dates, and the courses in it. Each course becomes a line on the term table.">
                  Name a term and its courses
                </Reads>
                <Meaning>
                  A term with its dates, and the courses in it. Each course
                  becomes a line on the term table.
                </Meaning>
                <td className="text-right text-sm">Yes</td>
              </tr>
              <tr>
                <td data-figures className="pr-4 text-sm text-muted-foreground">
                  4
                </td>
                <Reads meaning="A title and a date is enough. An estimate and a priority sharpen the ranking; a course puts it on a line.">
                  Add what is due
                </Reads>
                <Meaning>
                  A title and a date is enough. An estimate and a priority
                  sharpen the ranking; a course puts it on a line.
                </Meaning>
                <td className="text-right text-sm">No</td>
              </tr>
              <tr>
                <td data-figures className="pr-4 text-sm text-muted-foreground">
                  5
                </td>
                <Reads meaning="Printed the moment one thing has a date, and re-printed every time you open it.">
                  Read today&apos;s entry
                </Reads>
                <Meaning>
                  Printed the moment one thing has a date, and re-printed every
                  time you open it.
                </Meaning>
                <td className="text-right text-sm text-muted-foreground">—</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* SCOPE. What is not built, stated plainly, before anyone signs up for it. */}
        <section
          aria-labelledby="scope-heading"
          className="flex flex-col gap-4"
        >
          <RunningHead id="scope-heading">Not in this edition</RunningHead>
          <p className="max-w-[65ch] text-sm text-muted-foreground">
            Mentra is early, and this page says so. Some things students ask
            for are not built yet.
          </p>
          <table className="almanac-table">
            <thead>
              <tr>
                <th scope="col">Not yet</th>
                <th scope="col" className="hidden sm:table-cell">
                  For now
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Reads meaning="Deadlines live in Mentra, entered by you or filed by the assistant when you mention them.">
                  Calendar sync
                </Reads>
                <Meaning>
                  Deadlines live in Mentra, entered by you or filed by the
                  assistant when you mention them.
                </Meaning>
              </tr>
              <tr>
                <Reads meaning="Notes are text, filed against a course or a piece of work and searched by keyword.">
                  Uploading files
                </Reads>
                <Meaning>
                  Notes are text, filed against a course or a piece of work and
                  searched by keyword.
                </Meaning>
              </tr>
              <tr>
                <Reads meaning="Mentra says what is next when you open it and is silent otherwise.">
                  Reminders and notifications
                </Reads>
                <Meaning>
                  Mentra says what is next when you open it and is silent
                  otherwise.
                </Meaning>
              </tr>
              <tr>
                <Reads meaning="One student per account. Nothing is shared.">
                  Group work and sharing
                </Reads>
                <Meaning>One student per account. Nothing is shared.</Meaning>
              </tr>
              <tr>
                <Reads meaning="Not tracked. Mentra ranks what is due, not how you did.">
                  Grades
                </Reads>
                <Meaning>
                  Not tracked. Mentra ranks what is due, not how you did.
                </Meaning>
              </tr>
            </tbody>
          </table>
        </section>

        {/* THE CLOSE. One sentence, one button. */}
        <section
          aria-labelledby="close-heading"
          className="flex flex-col items-start gap-4"
        >
          <RunningHead id="close-heading">Your edition</RunningHead>
          <p className="max-w-[55ch] font-display text-[1.25rem] leading-[1.3] font-semibold tracking-[-0.015em] text-balance">
            A term, its courses, and what is due. Mentra prints the rest, and
            tells you why.
          </p>
          <Link href="/sign-up" className={CTA_PRIMARY}>
            Start your first term
          </Link>
        </section>
      </main>

      {/* COLOPHON. How the edition is made, in the small type at the back. */}
      <footer className="mt-16 border-t-2 border-rule-strong pt-4">
        <p className="max-w-[70ch] text-xs leading-relaxed text-muted-foreground">
          Mentra. Set in Bitter and Archivo. Built on Next.js, Prisma and
          Postgres, signed in with Better Auth. The ranking is arithmetic and
          runs on the server. The assistant is an OpenAI model that reads and
          writes through sixteen checked tools and nothing else; it cannot see
          the page, the web or your files. Error reports are scrubbed of your
          words before they leave.{" "}
          <Link
            href="/sign-in"
            className="text-foreground underline underline-offset-4 hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            Sign in
          </Link>
          {" · "}
          <Link
            href="/sign-up"
            className="text-foreground underline underline-offset-4 hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            Create account
          </Link>
        </p>
      </footer>
    </div>
  );
}
