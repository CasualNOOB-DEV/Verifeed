/**
 * Extension Popup Script
 */

interface StatusResponse {
  enabled: boolean;
  globalEnabled: boolean;
  siteDisabled: boolean;
}

document.addEventListener('DOMContentLoaded', async () => {
  // Get DOM elements
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');
  const siteName = document.getElementById('site-name');
  const toggleSiteBtn = document.getElementById('toggle-site-btn');
  const enableSiteBtn = document.getElementById('enable-site-btn');
  const settingsBtn = document.getElementById('settings-btn');
  const infoSection = document.getElementById('info-section');
  const disabledSection = document.getElementById('disabled-section');
  const statsSection = document.getElementById('stats-section');
  const siteToggleSection = document.getElementById('site-toggle-section');
  const versionEl = document.getElementById('version');

  // Set version
  const manifest = chrome.runtime.getManifest();
  if (versionEl) {
    versionEl.textContent = `v${manifest.version}`;
  }

  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentUrl = tab?.url || '';
  
  // Extract hostname
  let hostname = '';
  try {
    hostname = new URL(currentUrl).hostname.replace('www.', '');
  } catch {
    hostname = 'this page';
  }

  // Update site name
  if (siteName) {
    siteName.textContent = hostname;
  }

  // Check status from background
  chrome.runtime.sendMessage({ action: 'checkEnabled', url: currentUrl }, (response: StatusResponse) => {
    updateUI(response);
  });

  /**
   * Update UI based on status
   */
  function updateUI(status: StatusResponse) {
    if (!status.globalEnabled) {
      // Globally disabled
      statusDot?.classList.remove('active');
      statusDot?.classList.add('disabled');
      if (statusText) statusText.textContent = 'Disabled globally';
      if (infoSection) infoSection.style.display = 'none';
      if (disabledSection) disabledSection.style.display = 'none';
      if (statsSection) statsSection.style.display = 'none';
      if (siteToggleSection) siteToggleSection.style.display = 'none';
    } else if (status.siteDisabled) {
      // Disabled on this site
      statusDot?.classList.remove('active');
      statusDot?.classList.add('disabled');
      if (statusText) statusText.textContent = 'Disabled on this site';
      if (infoSection) infoSection.style.display = 'none';
      if (disabledSection) disabledSection.style.display = 'block';
      if (statsSection) statsSection.style.display = 'none';
      if (siteToggleSection) siteToggleSection.style.display = 'none';
    } else {
      // Active
      statusDot?.classList.add('active');
      statusDot?.classList.remove('disabled');
      if (statusText) statusText.textContent = 'Active';
      if (infoSection) infoSection.style.display = 'block';
      if (disabledSection) disabledSection.style.display = 'none';
      if (statsSection) statsSection.style.display = 'block';
      if (siteToggleSection) siteToggleSection.style.display = 'block';
      if (toggleSiteBtn) toggleSiteBtn.textContent = 'Disable on this site';
    }
  }

  /**
   * Toggle site enabled/disabled
   */
  async function toggleSite() {
    const response = await new Promise<any>((resolve) => {
      chrome.runtime.sendMessage({ action: 'toggleCurrentSite', url: currentUrl }, resolve);
    });

    if (response.success) {
      // Refresh status
      chrome.runtime.sendMessage({ action: 'checkEnabled', url: currentUrl }, (status: StatusResponse) => {
        updateUI(status);
        // Reload the tab to apply changes
        if (tab?.id) {
          chrome.tabs.reload(tab.id);
        }
      });
    }
  }

  // Event listeners
  toggleSiteBtn?.addEventListener('click', toggleSite);
  enableSiteBtn?.addEventListener('click', toggleSite);

  settingsBtn?.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
});
