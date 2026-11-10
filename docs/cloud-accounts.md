# PatternLab accounts and progress sync

## Current structure

- `site/index.html`, `practice.html`, `patterns.html`, and `progress.html` are page shells. They share one app module and stylesheet.
- `site/challenges.js`, `roadmap.js`, and `tutor-guides.js` hold the challenge catalog and learning content.
- `site/app.js` handles navigation, local drafts, guided practice, and progress. Python and JavaScript have separate Web Workers.
- Browser-only use stores progress in that browser's local storage. Export a memory backup from Progress if you want a manual copy.
- `site/supabase-config.js` is the public connection point. It must contain a Supabase project URL and publishable key before account sign-up can work.
- `supabase/migrations/20261110000100_patternlab_progress.sql` creates a user-owned progress table with row-level security (RLS).

## Enable account sync

1. Create a Supabase project and keep its database password private.
2. In Supabase SQL Editor, run the migration at `supabase/migrations/20261110000100_patternlab_progress.sql`.
3. In Authentication URL Configuration, add the deployed site URL `https://hdutee65.github.io/patternlab-dsa-practice/` to Site URL and Redirect URLs. Add the local development URL too if needed, such as `http://127.0.0.1:8001/**`.
4. In Project Settings → API, copy the Project URL and **publishable** key (`sb_publishable_…`). Put those two public values in `site/supabase-config.js`:

   ```js
   window.PATTERNLAB_SUPABASE_CONFIG = Object.freeze({
     url: 'https://YOUR_PROJECT_REF.supabase.co',
     publishableKey: 'sb_publishable_YOUR_PUBLIC_KEY'
   });
   ```

5. Publish the updated static site. Open the account button, create an account, and confirm the email link. Then sign in on another device to load the same progress.

Never put a Supabase secret or service-role key in this repository or browser code. The publishable key is meant to be public; RLS is what restricts each row to its signed-in owner. The app stores only the user's progress snapshot in `patternlab_progress`; passwords are handled by Supabase Auth. Supabase's default email sender has strict low-volume limits, so configure a trusted SMTP provider for broader use.

## Privacy and limits

- Cloud sync is opt-in. Without project configuration, progress stays on the current browser and sign-up is clearly marked as unavailable.
- Row policies require `auth.uid() = user_id` for reading, inserting, and updating. The table has no anonymous permissions.
- A user changing accounts in one browser does not merge another account's cached study trail into the newly signed-in account.
- This static app does not have a server-side administrator or privileged database key.
- Draft conflicts are resolved by the latest locally recorded draft timestamp. Progress attempts are merged and deduplicated by timestamp and result.
- GitHub Pages serves static files; do not put private credentials or personal secrets in public files.
