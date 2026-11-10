# PatternLab browser site

This static frontend is deployed on GitHub Pages. Its main page shells share `app.js`, `styles.css`, the challenge catalog, roadmap, and tutor guides.

- Python runs in a browser Web Worker powered by Pyodide.
- JavaScript runs in a separate browser Web Worker. Both local runners use `solve(data)` and sample plus generated checks.
- C++, Java, and TypeScript open the problem on LeetCode for its official function signature and compiler.
- By default, drafts and study progress stay in this browser's local storage. Use the Progress page to export/import a JSON backup.
- Optional cross-device account sync uses Supabase Auth and the RLS-protected `patternlab_progress` table. See `../docs/cloud-accounts.md` or `/cloud-setup.html` for setup. Account creation remains unavailable until `supabase-config.js` has a project URL and public publishable key.

Never add a Supabase secret or service-role key to this static site. The published HTML and JavaScript are public.
