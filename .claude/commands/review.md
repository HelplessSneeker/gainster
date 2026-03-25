Review open changes in the codebase and provide actionable feedback.

## Instructions

Use the **Code Reviewer** agent (subagent_type: "Code Reviewer") to perform this task. Launch the agent with the following prompt:

---

Review all uncommitted changes in the codebase and provide constructive, actionable feedback.

### Steps

1. Run `git status` to see all modified and untracked files.
2. Run `git diff` to see unstaged changes and `git diff --cached` to see staged changes.
3. For any new untracked files, read them in full.
4. Review all changes for:
   - **Correctness**: Logic errors, off-by-one mistakes, missing edge cases.
   - **Security**: Injection risks, leaked secrets, unsafe defaults.
   - **Performance**: Unnecessary allocations, N+1 queries, missing indexes.
   - **Maintainability**: Unclear naming, missing error handling, overly complex code.
5. Present findings grouped by file, with severity (critical / warning / nit) and specific suggestions for improvement.
6. If the changes look good, say so — don't invent issues.
