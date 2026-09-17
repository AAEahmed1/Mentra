<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Keep ASSISTANT.md in step with the assistant

`ASSISTANT.md` documents what the Ask Mentra assistant can and cannot do. It is
the answer we give when someone asks what the AI is actually capable of, so a
stale answer is worse than none.

Any change under `src/lib/ai/` — a tool added, removed or reshaped, an edit to
the prompt in `system-prompt.ts`, a change to `MAX_TOOL_ROUNDS`, the history
window, the default model, or what a tool returns — updates `ASSISTANT.md` in
the same commit. The
same goes for exposing a service the assistant previously could not reach: the
"What it cannot do" list is a promise, and it has to stay true.

# Keep the docs in step with the code

`docs/` describes how Mentra works: architecture, data model, domain rules,
authentication, frontend, configuration, development, deployment, security and
known issues. A change that makes any of it untrue — a new environment
variable, route, model, validation rule, script or deployment step — updates
the relevant page in the same commit. Fixing something listed in
`docs/known-issues.md` removes it from that list.
