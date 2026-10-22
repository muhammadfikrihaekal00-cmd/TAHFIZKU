# Auto-Deploy to Vercel Rule

Whenever the assistant makes modifications to files in this repository:
1. Always bump the cache buster query string in `index.html` (e.g. `?v=X.Y`).
2. Always execute `git add .`, `git commit -m "..."`, and `git push origin main`.
3. Never finish a turn leaving uncommitted or unpushed modifications in the working tree.
4. Inform the user that the changes have been deployed to Vercel.
