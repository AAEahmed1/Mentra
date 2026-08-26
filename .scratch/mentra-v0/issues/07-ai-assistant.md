# 07: AI assistant — chat panel + tool-calling loop + explainability

**What to build:** The AI assistant that ties the whole app together: a persistent chat panel where the student can ask "what should I do tonight?", get a recommendation grounded in their real data, and ask "why?" to get the actual factors behind it. The AI never invents facts — it reads and writes only through tools; the database stays the source of truth.

**Blocked by:** 02, 03, 04, 05 (needs Course, Task, Note, and Memory tools to call)

**Status:** implemented

**Design:** No direction round — the panel inherits DESIGN.md's Card Catalog system (punched-hole card mark, cardstock ground, dashed slots for the opening prompts, mono metadata).

**Note:** plan.md's v0 tool list included `search_memory` but no write path, leaving Memory permanently empty in v0. This ticket adds `save_memory` to close that gap so the assistant can actually record explicit/inferred facts during conversation.

- [x] OpenAI API wired with function/tool calling; `OPENAI_API_KEY` and `OPENAI_MODEL` read from env. Model is `gpt-5.6-luna` (the ticket said GPT-4o/4.1; that generation is superseded — see model note below)
- [x] All nine tools implemented and exposed: `get_courses`, `get_tasks`, `get_deadlines`, `create_task`, `update_task`, `complete_task`, `search_memory`, `search_notes`, `save_memory`
- [x] Tool-call validation layer (`src/lib/ai/tools.ts`): unknown tool names refused, arguments parsed with zod, undeclared arguments stripped. The app executes against the services from tickets 02–06; the model never touches Prisma
- [x] Persistent chat panel, mounted in the root layout behind a session check so it's reachable from every authenticated page without each page opting in
- [x] Answers "what should I do tonight?" from real data via `get_deadlines`, which returns ticket 06's ranking
- [x] Explains a recommendation from the actual factors — verified live citing "due today, high priority, 45 min estimate" and correctly flagging that the estimate exceeded the 20 minutes the student said they had
- [x] Unit tests for tool-call argument validation — 26 cases covering unknown tools, non-object arguments, missing/wrong-typed/out-of-enum values, and stripping of undeclared keys

**Ownership can't come from the model.** No tool accepts a `userId`; it's bound server-side from the session in the API route. A test asserts this for every tool by inspecting the schemas, plus one that a `userId` smuggled into arguments is discarded — so a confused or manipulated model has no way to name another student's data.

**Cost and loop safety.** `MAX_TOOL_ROUNDS` caps tool round-trips per turn, so a looping model can't run up spend; the request body caps history at 20 messages. Rejected or failing tool calls are returned to the model as tool results rather than thrown, so the assistant recovers and says something useful instead of the turn dying — both covered by tests.

**Two live fixes:**
- `gpt-5.6-luna` rejects function tools combined with reasoning on `/v1/chat/completions` (400, `reasoning_effort`). Set `reasoning_effort: "none"` — correct for this workload anyway, since ranking is already decided by `rankTasks` and the model only routes and phrases.
- The model emitted markdown (`**bold**`) which rendered literally in the plain-text panel. System prompt now forbids markup.

**Model note:** the ticket named GPT-4o/4.1 when written. Current lineup is `gpt-5.6-sol` / `-terra` / `-luna`; luna is the cost-optimized tier at $0.20/$1.20 per 1M tokens, roughly $0.002 per chat turn. Chosen because the assistant's job is deliberately narrow — the ranking is deterministic, so the model routes to a tool and phrases the result rather than reasoning about priorities. `OPENAI_MODEL` makes upgrading a config change if tool-call accuracy ever disappoints.

**Verified live:** ranked recommendation grounded in real tasks, an available-time question producing a correctly-caveated answer, `create_task` from natural language ("about 2 hours" → 120 min) persisting with every field correct, and two memories saved with correct type classification (behavioral vs learning-state) and provenance. Panel confirmed working from a non-dashboard page. Light + dark, desktop + mobile. Build, lint, 159 tests, detector clean.
