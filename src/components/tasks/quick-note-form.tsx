"use client";

import { createNoteAction } from "@/lib/actions/note";
import { useQuickForm } from "@/lib/use-row-actions";
import { FormErrors } from "@/components/filed-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * Writing a note without leaving the work it is about.
 *
 * The task is already known, so there is no picker here — that is the whole
 * point of writing it from inside the row rather than from the notes page.
 */
export function QuickNoteForm({ taskId }: { taskId: string }) {
  const form = useQuickForm(createNoteAction);

  return (
    <form
      key={form.formKey}
      action={form.submit}
      className="flex flex-col gap-2"
    >
      <input type="hidden" name="taskId" value={taskId} />

      <Label htmlFor={`quick-note-title-${taskId}`} className="text-xs">
        Add a note
      </Label>
      <Input
        id={`quick-note-title-${taskId}`}
        name="title"
        placeholder="What did you work out?"
        required
        className="h-7 text-xs"
      />
      <Textarea
        name="body"
        rows={2}
        placeholder="The detail worth keeping."
        required
        className="text-xs"
        aria-label="Note"
      />

      <FormErrors errors={form.errors} />

      <div>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={form.isPending}
        >
          {form.isPending ? "Saving…" : "Save note"}
        </Button>
      </div>
    </form>
  );
}
