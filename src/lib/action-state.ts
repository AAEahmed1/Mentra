/**
 * What a one-shot row action (complete, remove, forget) reports back. Unlike a
 * form, there are no fields to show errors beside, so a failure is one sentence
 * the row prints in place.
 */
export type RowActionResult = { error: string | null };

export const ROW_ACTION_OK: RowActionResult = { error: null };
