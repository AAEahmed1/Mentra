import type { Metadata } from "next";
import Link from "next/link";

import { requireUserId } from "@/lib/session";
import { AppHeader } from "@/components/app-header";
import { searchNotesForUser } from "@/lib/services/note";
import { listCoursesForUser } from "@/lib/services/course";
import { CreateNoteForm } from "@/components/notes/create-note-form";
import { NoteRow } from "@/components/notes/note-row";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="min-h-svh bg-background">
      <AppHeader current="/notes" />

      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-balance">
            Notes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            What you&apos;ve written down — searchable, optionally filed under a
            course.
          </p>
        </div>

        <form method="get" className="flex items-end gap-2">
          <div className="flex flex-1 flex-col gap-2">
            <label htmlFor="notes-search" className="sr-only">
              Search notes
            </label>
            <Input
              id="notes-search"
              name="q"
              type="search"
              placeholder="Search your notes"
              defaultValue={query}
            />
          </div>
          <Button type="submit" variant="outline">
            Search
          </Button>
          {query && (
            <Link
              href="/notes"
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Clear
            </Link>
          )}
        </form>

        {notes.length > 0 ? (
          <Card>
            <CardContent>
              <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
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
            </CardContent>
          </Card>
        ) : (
          query && (
            <p className="text-sm text-muted-foreground">
              No notes match &ldquo;{query}&rdquo;.
            </p>
          )
        )}

        <div className="rounded-lg border border-dashed border-border p-5">
          <h2 className="mb-4 text-sm font-medium text-muted-foreground">
            Add a note
          </h2>
          <CreateNoteForm courses={courseOptions} />
        </div>
      </main>
    </div>
  );
}
