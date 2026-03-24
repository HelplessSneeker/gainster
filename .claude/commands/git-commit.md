Stage all changes (tracked and untracked), then create a single commit with a descriptive message.

## Instructions

Use the **Git Workflow Master** agent (subagent_type: "Git Workflow Master") to perform this task. Launch the agent with the following prompt:

---

Stage all changes and create a single git commit with a descriptive message.

### Steps

1. Run `git status` and `git diff` (staged + unstaged) to understand all changes.
2. Run `git log --oneline -5` to match the repo's commit message style.
3. Stage all changes with `git add -A`.
4. Write a concise, descriptive commit message summarizing the "why" behind the changes.
5. Do NOT include any co-author trailers (no "Co-Authored-By" lines).
6. Commit using a HEREDOC for the message.
7. Run `git status` after committing to verify success.
