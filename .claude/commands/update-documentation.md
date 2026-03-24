Review and update all documentation files (CLAUDE.md, AGENTS.md, README.md) to ensure they accurately reflect the current state of the codebase.

## Instructions

Use the **Technical Writer** agent (subagent_type: "Technical Writer") to perform this task. Launch the agent with the following prompt:

---

Review and update the project documentation files — CLAUDE.md, AGENTS.md, and README.md — so they accurately reflect the current state of the codebase.

### Steps

1. **Read current docs**: Read CLAUDE.md, AGENTS.md, and README.md in full.

2. **Audit against actual code**: Explore the codebase — check package.json files, tsconfig files, directory structure, source code, and dependencies — to verify every claim made in the documentation.

3. **Fix inaccuracies**: Correct any documentation that no longer matches reality. This includes:
   - Commands that have changed, been added, or been removed
   - Architecture descriptions that are outdated
   - Dependencies or tooling references that are wrong
   - File paths or directory structures that have shifted
   - Configuration details that no longer apply

4. **Remove unnecessary content**: Strip out anything that is:
   - Redundant or duplicated across files
   - Obvious from the code itself and adds no value
   - Stale references to things that no longer exist
   - Aspirational statements about features not yet implemented (unless clearly marked as planned)

5. **Best practices**:
   - Keep documentation concise and scannable — prefer bullet points and code blocks over prose
   - Document the "why" and "how", not the "what" that is self-evident from code
   - Ensure commands listed are runnable and produce the described result
   - Do not invent or assume details — only document what is verifiable in the codebase
   - Keep CLAUDE.md focused on instructions for AI tooling; keep README.md focused on human onboarding

6. **Verify before writing**: Before making any edit, confirm the change is warranted by reading the relevant source files. Do not guess.

7. **Summary**: After updating, provide a brief summary of what changed and why.
