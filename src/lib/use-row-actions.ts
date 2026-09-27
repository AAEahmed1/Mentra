"use client";

import {
  useState,
  useSyncExternalStore,
  useTransition,
  type FormEvent,
} from "react";

import type { RowActionResult } from "@/lib/action-state";

type FormActionState = { errors: string[] };

type FormAction = (
  previous: FormActionState,
  formData: FormData
) => Promise<FormActionState>;

type RowAction = (formData: FormData) => Promise<RowActionResult>;

/**
 * True once React has hydrated, false on the server and on the client's
 * first render. Any form that submits via `onSubmit` instead of `action`
 * renders with no working submit path until hydration attaches the handler;
 * before then, Enter or a click falls through to the browser's native
 * submit. Gating the submit button on this closes that window.
 */
export function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

/**
 * The read-then-edit-in-place behaviour every filed row shares.
 *
 * Keeps the row closed until the student opens it, submits through a
 * transition so the row can show pending state, and only closes on success —
 * validation errors keep the form open with the student's input intact.
 *
 * The form calls `onSubmit`, not `action`: React resets an uncontrolled
 * form's fields after any `<form action={fn}>` submission completes,
 * regardless of what it returned, which would empty the student's input right
 * when a validation error needs it kept. `onSubmit` prevents the default
 * submission and builds the `FormData` itself, so nothing gets reset.
 */
export function useInlineEdit(action: FormAction) {
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
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
    onSubmit,
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
 * Builds the single-field FormData these server actions expect, and keeps the
 * action's error so a row can say when nothing happened instead of staying
 * silent.
 */
export function useRowAction(action: RowAction) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(field: string, value: string) {
    const formData = new FormData();
    formData.set(field, value);
    startTransition(async () => {
      const result = await action(formData);
      setError(result.error);
    });
  }

  return { isPending, error, run };
}

/**
 * A small form that stays put after it succeeds, ready for the next entry —
 * writing one note about a piece of work usually means writing another.
 *
 * Clears its fields on success and keeps them on failure, so a validation
 * error never costs the student what they typed.
 *
 * The form calls `onSubmit`, not `action`: React resets an uncontrolled
 * form's fields after any `<form action={fn}>` submission completes,
 * regardless of what it returned, which would empty the student's input right
 * when a validation error needs it kept. `onSubmit` prevents the default
 * submission and builds the `FormData` itself, so nothing gets reset; success
 * still clears the fields, but on purpose, by remounting the form.
 */
export function useQuickForm(action: FormAction) {
  // Clearing by remount rather than a ref: the fields are uncontrolled, so
  // bumping the key gives empty ones without reading a ref during render.
  const [formKey, setFormKey] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  // These forms render server-side with no `action`, so `onSubmit` is the
  // only thing stopping a submit — and it does nothing until React has
  // hydrated and attached the handler. Submit (via Enter or the button)
  // before then would otherwise fall through to the browser's default
  // submission; `method="post"` on the form keeps that from putting field
  // values in the URL, and gating the submit button on `isHydrated` closes
  // the window entirely, since it only turns true once `onSubmit` is live.
  const isHydrated = useHydrated();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await action({ errors: [] }, formData);

      if (result.errors.length > 0) {
        setErrors(result.errors);
        return;
      }

      setErrors([]);
      setFormKey((previous) => previous + 1);
    });
  }

  return { formKey, errors, isPending, isHydrated, onSubmit };
}
