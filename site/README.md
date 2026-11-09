# PatternLab static demo

The `site/` folder is the recruiter-facing static app. It runs Python in a browser Web Worker with Pyodide; submitted code stays in that browser and progress/drafts are saved in local storage. The GitHub Actions workflow publishes this folder to GitHub Pages. No paid Azure resources or app backend are required.

For a quick preview, run `python3 -m http.server 8001 --directory site` and open `http://127.0.0.1:8001`. Python loads from the official Pyodide distribution on jsDelivr, so the first run needs an internet connection.
