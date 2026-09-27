"use client";

import { createSemesterAction } from "@/lib/actions/semester";
import { useQuickForm } from "@/lib/use-row-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateSemesterForm() {
  const form = useQuickForm(createSemesterAction);

  return (
    <form
      key={form.formKey}
      method="post"
      onSubmit={form.onSubmit}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Semester name</Label>
        <Input id="name" name="name" placeholder="e.g. Fall 2026" required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="startDate">Starts</Label>
          <Input id="startDate" name="startDate" type="date" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="endDate">Ends</Label>
          <Input id="endDate" name="endDate" type="date" required />
        </div>
      </div>

      {form.errors.length > 0 && (
        <div
          role="alert"
          className="rounded-xs border border-destructive/45 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {form.errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}

      <Button type="submit" disabled={!form.isHydrated || form.isPending}>
        {form.isPending ? "Adding…" : "Add semester"}
      </Button>
    </form>
  );
}
