(() => {
  const installButton = document.getElementById('install-app');
  const connectionBanner = document.getElementById('connection-banner');
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
  let installPrompt = null;

  if (installButton && !isStandalone) installButton.hidden = false;

  function updateConnectionStatus() {
    if (!connectionBanner) return;
    connectionBanner.hidden = navigator.onLine;
    connectionBanner.setAttribute('aria-hidden', String(navigator.onLine));
  }

  updateConnectionStatus();
  window.addEventListener('online', updateConnectionStatus);
  window.addEventListener('offline', updateConnectionStatus);

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {
      // The site remains usable if this browser blocks offline support.
    });
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    if (installButton) installButton.dataset.installable = 'true';
  });

  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    if (installButton) installButton.hidden = true;
  });

  function showInstallHelp() {
    let dialog = document.getElementById('install-help-dialog');
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.className = 'install-dialog';
      dialog.id = 'install-help-dialog';
      dialog.innerHTML = '<form method="dialog" class="install-dialog-close"><button class="dialog-close" aria-label="Close install help">×</button></form><div class="install-dialog-inner"><span class="section-kicker">TAKE YOUR PRACTICE WITH YOU</span><h2>Install PatternLab</h2><p>On iPhone or iPad, tap Share, then choose <strong>Add to Home Screen</strong>. In Chrome or Edge, open the browser menu and choose <strong>Install PatternLab</strong> or <strong>Add to Home screen</strong>.</p><form method="dialog"><button class="button button-primary">Got it</button></form></div>';
      document.body.append(dialog);
    }
    dialog.showModal();
  }

  installButton?.addEventListener('click', async () => {
    if (!installPrompt) {
      showInstallHelp();
      return;
    }
    installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') installButton.hidden = true;
    installPrompt = null;
  });
})();
