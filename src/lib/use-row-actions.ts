"use client";

import { useState, useTransition } from "react";

type FormActionState = { errors: string[] };

type FormAction = (
  previous: FormActionState,
  formData: FormData
) => Promise<FormActionState>;

type VoidAction = (formData: FormData) => Promise<void>;

/**
 * The read-then-edit-in-place behaviour every filed row shares.
 *
 * Keeps the row closed until the student opens it, submits through a
 * transition so the row can show pending state, and only closes on success —
 * validation errors keep the form open with the student's input intact.
 */
export function useInlineEdit(action: FormAction) {
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await action({ errors: [] }, formData);

      if (result.errors.length > 0) {
        setErrors(result.errors);
        return;
      }

      setErrors([]);
      setIsEditing(false);
    });
  }

  return {
    isEditing,
    errors,
    isPending,
    submit,
    open: () => setIsEditing(true),
    cancel: () => {
      // Drop stale errors too, so reopening starts clean.
      setErrors([]);
      setIsEditing(false);
    },
  };
}

/**
 * A one-shot row action with no form behind it — delete, complete, forget.
 * Builds the single-field FormData these server actions expect.
 */
export function useRowAction(action: VoidAction) {
  const [isPending, startTransition] = useTransition();

  function run(field: string, value: string) {
    const formData = new FormData();
    formData.set(field, value);
    startTransition(() => action(formData));
  }

  return { isPending, run };
}
