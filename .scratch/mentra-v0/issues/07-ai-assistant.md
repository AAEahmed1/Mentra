# 07: AI assistant — chat panel + tool-calling loop + explainability

**What to build:** The AI assistant that ties the whole app together: a persistent chat panel where the student can ask "what should I do tonight?", get a recommendation grounded in their real data, and ask "why?" to get the actual factors behind it. The AI never invents facts — it reads and writes only through tools; the database stays the source of truth.

**Blocked by:** 02, 03, 04, 05 (needs Course, Task, Note, and Memory tools to call)

**Status:** ready-for-agent

**Design:** Invoke the `impeccable` skill for the chat panel UI (slide-out from the dashboard).

**Note:** plan.md's v0 tool list included `search_memory` but no write path, leaving Memory permanently empty in v0. This ticket adds `save_memory` to close that gap so the assistant can actually record explicit/inferred facts during conversation.

- [ ] OpenAI API wired (GPT-4o or GPT-4.1) with function/tool calling; `OPENAI_API_KEY` read from env
- [ ] Tools implemented and exposed to the model: `get_courses`, `get_tasks`, `get_deadlines`, `create_task`, `update_task`, `complete_task`, `search_memory`, `search_notes`, `save_memory`
- [ ] Tool-call validation layer: the app validates arguments and executes against Prisma directly; the model never touches the DB
- [ ] Persistent chat panel (slide-out from dashboard), accessible on any authenticated page
- [ ] Assistant answers "what should I do tonight?" using real task/course data (may reuse ticket 06's sort function as a tool or shared utility)
- [ ] Assistant explains a recommendation on request, citing actual factors (deadline, priority, estimated time) — no generic/canned explanations
- [ ] Unit tests for tool-call argument validation (rejects malformed/out-of-scope calls)
