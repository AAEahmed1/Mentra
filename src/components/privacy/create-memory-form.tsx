"use client";

import { useActionState } from "react";

import {
  createMemoryAction,
  type MemoryActionState,
} from "@/lib/actions/memory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const initialState: MemoryActionState = { errors: [] };

export function CreateMemoryForm() {
  const [state, formAction, isPending] = useActionState(
    createMemoryAction,
    initialState
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="memory-content">What Mentra knows</Label>
        <Input
          id="memory-content"
          name="content"
          placeholder="e.g. Student struggles with subnetting"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="memory-type">Type</Label>
          <Select id="memory-type" name="type" defaultValue="profile">
            <option value="profile">Profile</option>
            <option value="commitment">Commitment</option>
            <option value="learning_state">Learning state</option>
            <option value="behavioral">Behavioral</option>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="memory-source">Source</Label>
          <Select id="memory-source" name="source" defaultValue="explicit">
            <option value="explicit">You told me</option>
            <option value="inferred">I inferred</option>
          </Select>
        </div>
      </div>

      {state.errors.length > 0 && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}

      <Button type="submit" disabled={isPending} variant="outline">
        {isPending ? "Saving…" : "Add memory"}
      </Button>
    </form>
  );
}
