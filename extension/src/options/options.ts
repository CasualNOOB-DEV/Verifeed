/**
 * Verifeed Options Page
 * Handles settings management
 */

import { VerifeedSettings, DEFAULT_SETTINGS } from '../types';

class OptionsPage {
  private settings: VerifeedSettings = { ...DEFAULT_SETTINGS };

  constructor() {
    this.init();
  }

  private async init() {
    // Load settings first
    await this.loadSettings();
    
    // Update UI with loaded settings
    this.updateUI();
    
    // Attach event listeners
    this.attachEventListeners();
    
    // Set version
    const manifest = chrome.runtime.getManifest();
    const versionEl = document.getElementById('version');
    if (versionEl) {
      versionEl.textContent = manifest.version;
    }
  }

  /**
   * Load settings from chrome.storage.sync
   */
  private async loadSettings(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(DEFAULT_SETTINGS, (data) => {
        this.settings = data as VerifeedSettings;
        resolve();
      });
    });
  }

  /**
   * Save settings to chrome.storage.sync
   */
  private async saveSettings(): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set(this.settings, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          // Notify all tabs that settings changed
          chrome.runtime.sendMessage({ action: 'settingsUpdated', settings: this.settings });
          resolve();
        }
      });
    });
  }

  /**
   * Update UI elements with current settings
   */
  private updateUI() {
    // Global enabled toggle
    const enabledToggle = document.getElementById('enabled') as HTMLInputElement;
    if (enabledToggle) {
      enabledToggle.checked = this.settings.enabled;
    }

    // API endpoint
    const apiEndpointInput = document.getElementById('apiEndpoint') as HTMLInputElement;
    if (apiEndpointInput) {
      apiEndpointInput.value = this.settings.apiEndpoint;
    }

    // Highlight opacity
    const opacitySlider = document.getElementById('highlightOpacity') as HTMLInputElement;
    const opacityValue = document.getElementById('opacityValue');
    if (opacitySlider && opacityValue) {
      opacitySlider.value = this.settings.highlightOpacity.toString();
      opacityValue.textContent = `${this.settings.highlightOpacity}%`;
    }

    // Render disabled sites list
    this.renderDisabledSites();
  }

  /**
   * Render the list of disabled sites
   */
  private renderDisabledSites() {
    const listEl = document.getElementById('disabledSitesList');
    const emptyMsg = document.getElementById('noSitesMessage');
    
    if (!listEl || !emptyMsg) return;

    if (this.settings.disabledSites.length === 0) {
      listEl.innerHTML = '';
      emptyMsg.style.display = 'block';
      return;
    }

    emptyMsg.style.display = 'none';
    listEl.innerHTML = this.settings.disabledSites
      .map(site => `
        <div class="site-item" data-site="${site}">
          <span class="site-name">${site}</span>
          <button class="remove-site" title="Remove">&times;</button>
        </div>
      `)
      .join('');

    // Attach remove handlers
    listEl.querySelectorAll('.remove-site').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const siteItem = (e.target as HTMLElement).closest('.site-item');
        const site = siteItem?.getAttribute('data-site');
        if (site) {
          this.removeSite(site);
        }
      });
    });
  }

  /**
   * Add a site to the disabled list
   */
  private addSite(site: string) {
    // Clean up the site string
    site = site.trim().toLowerCase();
    
    // Remove protocol and path
    site = site.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    
    // Remove www.
    site = site.replace(/^www\./, '');
    
    if (!site) return;
    
    // Check if already in list
    if (this.settings.disabledSites.includes(site)) {
      this.showStatus('Site already in list', 'error');
      return;
    }

    this.settings.disabledSites.push(site);
    this.renderDisabledSites();
    this.showStatus('Site added', 'success');
  }

  /**
   * Remove a site from the disabled list
   */
  private removeSite(site: string) {
    this.settings.disabledSites = this.settings.disabledSites.filter(s => s !== site);
    this.renderDisabledSites();
    this.showStatus('Site removed', 'success');
  }

  /**
   * Test API connection
   */
  private async testConnection() {
    const statusEl = document.getElementById('connectionStatus');
    const apiEndpoint = (document.getElementById('apiEndpoint') as HTMLInputElement).value;
    
    if (!statusEl) return;

    statusEl.className = 'connection-status loading';
    statusEl.textContent = 'Testing connection...';

    try {
      const response = await fetch(`${apiEndpoint}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data = await response.json();
        statusEl.className = 'connection-status success';
        statusEl.textContent = `✓ Connected! AI: ${data.ai || 'unknown'}`;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      statusEl.className = 'connection-status error';
      statusEl.textContent = `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Show save status message
   */
  private showStatus(message: string, type: 'success' | 'error') {
    const statusEl = document.getElementById('saveStatus');
    if (!statusEl) return;

    statusEl.textContent = message;
    statusEl.className = `save-status visible ${type}`;

    setTimeout(() => {
      statusEl.className = 'save-status';
    }, 3000);
  }

  /**
   * Attach all event listeners
   */
  private attachEventListeners() {
    // Save button
    document.getElementById('saveSettings')?.addEventListener('click', async () => {
      // Gather settings from UI
      this.settings.enabled = (document.getElementById('enabled') as HTMLInputElement).checked;
      this.settings.apiEndpoint = (document.getElementById('apiEndpoint') as HTMLInputElement).value;
      this.settings.highlightOpacity = parseInt((document.getElementById('highlightOpacity') as HTMLInputElement).value);

      try {
        await this.saveSettings();
        this.showStatus('Settings saved!', 'success');
      } catch (error) {
        this.showStatus('Failed to save settings', 'error');
      }
    });

    // Reset defaults button
    document.getElementById('resetDefaults')?.addEventListener('click', async () => {
      if (confirm('Reset all settings to defaults?')) {
        this.settings = { ...DEFAULT_SETTINGS };
        this.updateUI();
        await this.saveSettings();
        this.showStatus('Settings reset to defaults', 'success');
      }
    });

    // Test connection button
    document.getElementById('testConnection')?.addEventListener('click', () => {
      this.testConnection();
    });

    // Add site button
    document.getElementById('addSite')?.addEventListener('click', () => {
      const input = document.getElementById('newSite') as HTMLInputElement;
      if (input.value) {
        this.addSite(input.value);
        input.value = '';
      }
    });

    // Add site on Enter key
    document.getElementById('newSite')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const input = e.target as HTMLInputElement;
        if (input.value) {
          this.addSite(input.value);
          input.value = '';
        }
      }
    });

    // Add current site button
    document.getElementById('addCurrentSite')?.addEventListener('click', async () => {
      // Get the current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) {
        try {
          const url = new URL(tab.url);
          this.addSite(url.hostname);
        } catch {
          this.showStatus('Could not get current site', 'error');
        }
      }
    });

    // Opacity slider
    document.getElementById('highlightOpacity')?.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      const opacityValue = document.getElementById('opacityValue');
      if (opacityValue) {
        opacityValue.textContent = `${value}%`;
      }
    });

    // Enable/disable toggle - auto-save
    document.getElementById('enabled')?.addEventListener('change', async (e) => {
      this.settings.enabled = (e.target as HTMLInputElement).checked;
      await this.saveSettings();
      this.showStatus(this.settings.enabled ? 'Verifeed enabled' : 'Verifeed disabled', 'success');
    });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new OptionsPage();
});
