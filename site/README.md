# PatternLab browser site

This static frontend is deployed on GitHub Pages. Its main page shells share `app.js`, `styles.css`, the challenge catalog, roadmap, and tutor guides.

- Python runs in a browser Web Worker powered by Pyodide.
- JavaScript runs in a separate browser Web Worker. Both local runners use `solve(data)` and sample plus generated checks.
- C++, Java, and TypeScript open the problem on LeetCode for its official function signature and compiler.
- By default, drafts and study progress stay in this browser's local storage. Use the Progress page to export/import a JSON backup.
- Optional cross-device account sync is connected to Supabase Auth and the RLS-protected `patternlab_progress` table. Users create and confirm their own account before syncing. See `/cloud-setup.html` for the current account flow.
- The site is an installable progressive web app. Its service worker caches the site shell and study content for offline reading; Python's first runtime download and cloud account actions need internet access.

Never add a Supabase secret or service-role key to this static site. The published HTML and JavaScript are public.
