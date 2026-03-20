Review and update all documentation files (CLAUDE.md, AGENTS.md, README.md) to ensure they accurately reflect the current state of the codebase.

## Instructions

1. **Audit against actual code**: Read the current CLAUDE.md, AGENTS.md, and README.md files. Then explore the codebase — check package.json files, tsconfig files, directory structure, source code, and dependencies — to verify every claim made in the documentation.

2. **Fix inaccuracies**: Correct any documentation that no longer matches reality. This includes:
   - Commands that have changed, been added, or been removed
   - Architecture descriptions that are outdated
   - Dependencies or tooling references that are wrong
   - File paths or directory structures that have shifted
   - Configuration details that no longer apply

3. **Remove unnecessary content**: Strip out anything that is:
   - Redundant or duplicated across files
   - Obvious from the code itself and adds no value
   - Stale references to things that no longer exist
   - Aspirational statements about features not yet implemented (unless clearly marked as planned)

4. **Best practices**:
   - Keep documentation concise and scannable — prefer bullet points and code blocks over prose
   - Document the "why" and "how", not the "what" that is self-evident from code
   - Ensure commands listed are runnable and produce the described result
   - Do not invent or assume details — only document what is verifiable in the codebase
   - Keep CLAUDE.md focused on instructions for AI tooling; keep README.md focused on human onboarding

5. **Verify before writing**: Before making any edit, confirm the change is warranted by reading the relevant source files. Do not guess.

6. **Summary**: After updating, provide a brief summary of what changed and why.
