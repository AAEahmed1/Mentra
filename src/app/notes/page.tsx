import type { Metadata } from "next";
import Link from "next/link";

import { requireUserId } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { searchNotesForUser } from "@/lib/services/note";
import { listCoursesForUser } from "@/lib/services/course";
import { CreateNoteForm } from "@/components/notes/create-note-form";
import { NoteRow } from "@/components/notes/note-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "Notes — Mentra",
};

export default async function NotesPage({
  searchParams,
}: PageProps<"/notes">) {
  const userId = await requireUserId();
  const { q } = await searchParams;
  const query = typeof q === "string" ? q : "";

  const [notes, courses] = await Promise.all([
    searchNotesForUser(userId, query),
    listCoursesForUser(userId),
  ]);

  const courseNameById = new Map(
    courses.map((course) => [course.id, course.name])
  );
  const courseOptions = courses.map((course) => ({
    id: course.id,
    name: course.name,
  }));

  return (
    <AppShell
      title="Notes"
      lede="What you've written down, searchable, on a course line or on its own."
      actions={
        <form method="get" className="flex items-center gap-2">
          <label htmlFor="notes-search" className="sr-only">
            Search notes
          </label>
          <Input
            id="notes-search"
            name="q"
            type="search"
            placeholder="Search notes"
            defaultValue={query}
            className="w-48"
          />
          <Button type="submit" variant="outline">
            Search
          </Button>
          {query && (
            <Link
              href="/notes"
              className="text-sm text-muted-foreground underline hover:text-foreground"
            >
              Clear
            </Link>
          )}
        </form>
      }
    >
      {notes.length > 0 ? (
        <ul className="flex flex-col">
          {notes.map((note) => (
            <NoteRow
              key={note.id}
              note={note}
              courseName={
                note.courseId
                  ? (courseNameById.get(note.courseId) ?? null)
                  : null
              }
              courses={courseOptions}
            />
          ))}
        </ul>
      ) : (
        query && (
          <p className="text-sm text-muted-foreground">
            Nothing matches &ldquo;{query}&rdquo;.
          </p>
        )
      )}

      <section className="flex flex-col gap-4 border-t border-rule pt-6">
        <h2 className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          Add a note
        </h2>
        <CreateNoteForm courses={courseOptions} />
      </section>
    </AppShell>
  );
}
