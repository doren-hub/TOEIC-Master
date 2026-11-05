# TOEIC-Master project instructions

## Existing project and verification

- This is a React 19 / TypeScript / Vite 6 application with Tailwind CSS 4. Keep the existing README and its AI Studio reference intact.
- Install locked dependencies with `npm ci --no-audit --no-fund`. Node.js is required; CI uses Node.js 24. The repository previously declared no minimum Node version.
- `npm run dev` serves on port 5173; `npm run build` produces `dist/`; `npm run lint` runs `tsc --noEmit`.
- There is no unit-test script or test suite. The configured `test` is the production build; it does not verify browser interactions or external APIs.
- `src/data/words.json` is the vocabulary source, imported through `src/data/words.ts`. Do not regenerate or change vocabulary as part of onboarding.
- `scripts/generate-words.mjs` and `scripts/import-tsl.mjs` use Gemini, read environment files and modify vocabulary. Do not execute these during onboarding or routine verification. Never read credentials, `.env*` (including examples) or `auth.json`.
- User profiles and learning progress use browser localStorage. Preserve existing storage formats and application behavior.

## Delivery and preservation

- Follow `.cursor/rules/common.mdc` if it is introduced. No repository AGENTS.md, AGENTS.local.md, workflow document, kurukuru config, Cursor rules or CI workflow existed at onboarding baseline `f4af519`.
- Use `codex/<short-description>`, an empty kickoff commit and a Draft PR starting with `Closes #<issue>`; put a linked task card in Doing when one exists.
- Preserve unique content before replacing generated documents; keep project-specific guidance here, retain applicable settings in `.kurukuru.toml`, regenerate with `kurukuru init`, and require `kurukuru init --check` to exit 0.
- Before Ready, the PR body must include background, main changes, tests/static checks and results, known limitations or review notes, and the closing issue reference.
- Independent Claude Opus 5.5 low-effort review is strictly Read/Glob/Grep-only (`[review].read_only = true`), with a persistent session for every re-review. Supply local command, execution time, duration, head SHA and exit code. Keep Draft until standalone `OK` for that exact head.
- After Ready, invoke `kurukuru ci-wait` once per reviewed head and wait for its final summary. Merge only on exit 0 with `--match-head-commit`; No CI never authorizes merging here. Failures retain Ready and require fixes, fresh local checks and re-review in the same session.
- The owner has approved the normal PR/review/merge workflow for onboarding issue #7 only. Do not start other issues, recursively launch kurukuru run/exec/queue/batch, register runners or bypass permissions.
- The caller owns ai-dispatch-log recording for this onboarding: do not call start, finish, codex-attach or antigravity-attach. In future sessions follow the dispatch ownership rules in the generated workflow.
- Work only in the independent onboarding clone. Never change `/Users/doren/Developer/TOEIC-Master`, and do not register either checkout during this task. After merge, tell the owner to fast-forward the original when safe, then run `kurukuru repos add /Users/doren/Developer/TOEIC-Master`.
