# TurfBook — Agent Rules

## 🧠 Memory File: Always Update `.agents/memory.md`

After **every task, fix, or decision** in this project, you MUST update `d:\PROJECTS\TurfBook\.agents\memory.md`.

### What to update each time:
1. **"Last updated"** date at the top of the file
2. **"Setup Decisions & Changes Made"** — append any new file changes with the file path, what changed, and why
3. **"Working State"** — update if the server behavior or startup output changes
4. **"Known Warnings"** — add or resolve warnings as they change
5. **"Next Steps / Pending Work"** — mark completed items `[x]`, add new tasks `[ ]`
6. **"Environment Configuration"** — update if `.env` changes

### Format for new change entries:
```
### N. `path/to/file.ts` — Modified | Rewritten | Created
- What changed (bullet points)
- **Why**: Reason for the change
```

### Rules:
- Always update memory.md **before ending your response** when any code or config changed
- Do NOT remove old entries — append new ones below existing ones
- Keep it factual and concise — future AI sessions will read this file as their first context
- If the user says "remember this" or "save this", update memory.md immediately
