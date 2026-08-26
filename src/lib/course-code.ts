/**
 * The short code stamped on the pulled card's index tab.
 *
 * Prefers the course's own code (the thing a student already recognises),
 * falling back to initials built from its name so every filed card can carry
 * a tab regardless of how much the student bothered to fill in.
 */
export function indexTabCode(
  course: { code: string | null; name: string } | null
): string | null {
  if (!course) return null;

  if (course.code) {
    const letters = course.code.replace(/[^a-zA-Z]/g, "");
    if (letters) return letters.slice(0, 4).toUpperCase();
  }

  const words = course.name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;

  if (words.length === 1) {
    return words[0].slice(0, 4).toUpperCase();
  }

  return words
    .map((word) => word[0])
    .join("")
    .slice(0, 4)
    .toUpperCase();
}
