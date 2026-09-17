/**
 * What one student can spend on the assistant.
 *
 * Every turn costs real money — up to six completions, each carrying the prompt,
 * the memories, forty lines of history and whatever the tools fetched — and
 * nothing else in the app stops a stuck client, a script or a bored student from
 * sending them in a loop. These are the ceilings, kept together so the cost of a
 * student is one file to read.
 */

/**
 * Turns a student may start in a rolling window. Thirty an hour is a question
 * every two minutes, sustained: well past a real study session, where the pace
 * is a few questions and then work, and low enough that a runaway loop is cut
 * off after dozens of turns rather than thousands.
 *
 * Counted from stored user messages, so it needs no table of its own and a
 * restart can't reset it. A turn that fails is never stored, so it doesn't count.
 */
export const MAX_TURNS_PER_WINDOW = 30;

export const TURN_WINDOW_MS = 60 * 60 * 1000;

/**
 * Output cap per completion. Replies are meant to be brief plain text, and a
 * tool-calling round needs a few hundred tokens at most, so 1200 leaves a long
 * answer room while stopping one completion from running on for pages.
 */
export const MAX_COMPLETION_TOKENS = 1200;
