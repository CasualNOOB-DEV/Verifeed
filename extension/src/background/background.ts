/**
 * Background Service Worker
 * Handles extension lifecycle, settings, and API coordination
 */

import { VerifeedSettings, DEFAULT_SETTINGS } from '../types';

console.log('[Verifeed] Background service worker initialized');

// Current settings cache
let currentSettings: VerifeedSettings = { ...DEFAULT_SETTINGS };

// Load settings on startup
loadSettings();

/**
 * Load settings from storage
 */
async function loadSettings(): Promise<VerifeedSettings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (data) => {
      currentSettings = data as VerifeedSettings;
      console.log('[Background] Settings loaded:', currentSettings.enabled ? 'enabled' : 'disabled');
      resolve(currentSettings);
    });
  });
}

/**
 * Check if a site is disabled
 */
function isSiteDisabled(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.replace('www.', '').toLowerCase();
    return currentSettings.disabledSites.some(site => 
      hostname === site || hostname.endsWith('.' + site)
    );
  } catch {
    return false;
  }
}

/**
 * Check if extension should be active for a given URL
 */
function isEnabledForUrl(url: string): boolean {
  // Global disable check
  if (!currentSettings.enabled) return false;
  
  // Skip chrome:// and extension pages
  if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
    return false;
  }
  
  // Check site-specific disable
  if (isSiteDisabled(url)) return false;
  
  return true;
}

// Handle installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[Verifeed] Extension installed');
    
    // Set default settings
    chrome.storage.sync.set(DEFAULT_SETTINGS);
  }
  
  // Create context menu
  createContextMenu();
});

/**
 * Create right-click context menu
 */
function createContextMenu() {
  chrome.contextMenus.create({
    id: 'verifeed-verify',
    title: 'Verify with Verifeed',
    contexts: ['selection'],
  }, () => {
    if (chrome.runtime.lastError) {
      console.log('[Verifeed] Context menu already exists or error:', chrome.runtime.lastError);
    } else {
      console.log('[Verifeed] Context menu created');
    }
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'verifeed-verify' && tab?.id) {
    const selectedText = info.selectionText;
    
    if (!selectedText || selectedText.length < 10) {
      console.log('[Verifeed] Selected text too short');
      return;
    }
    
    if (selectedText.length > 1000) {
      console.log('[Verifeed] Selected text too long');
      return;
    }
    
    console.log('[Verifeed] Verifying selected text:', selectedText.substring(0, 50));
    
    // Send to content script to show popup
    chrome.tabs.sendMessage(tab.id, {
      action: 'verifySelection',
      text: selectedText,
    }).catch((error) => {
      console.error('[Verifeed] Failed to send to content script:', error);
    });
  }
});

// Listen for settings changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    // Update local cache
    for (const [key, { newValue }] of Object.entries(changes)) {
      (currentSettings as any)[key] = newValue;
    }
    console.log('[Background] Settings updated');
    
    // Notify all tabs about the settings change
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.id && tab.url) {
          const enabled = isEnabledForUrl(tab.url);
          chrome.tabs.sendMessage(tab.id, {
            action: 'settingsUpdated',
            settings: currentSettings,
            enabled,
          }).catch(() => {
            // Tab might not have content script
          });
        }
      });
    });
  }
});

// Handle messages from content scripts and options page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Get current settings
  if (message.action === 'getSettings') {
    loadSettings().then(settings => {
      const url = sender.tab?.url || '';
      sendResponse({
        settings,
        enabled: isEnabledForUrl(url),
      });
    });
    return true;
  }

  // Check if enabled for current tab
  if (message.action === 'checkEnabled') {
    const url = sender.tab?.url || message.url || '';
    sendResponse({
      enabled: isEnabledForUrl(url),
      globalEnabled: currentSettings.enabled,
      siteDisabled: isSiteDisabled(url),
    });
    return true;
  }

  // Settings updated from options page
  if (message.action === 'settingsUpdated') {
    currentSettings = message.settings;
    return false;
  }
  
  // Handle health check
  if (message.action === 'healthCheck') {
    (async () => {
      try {
        const response = await fetch(`${currentSettings.apiEndpoint}/api/health`, { method: 'GET' });
        sendResponse({ success: response.ok });
      } catch {
        sendResponse({ success: false });
      }
    })();
    return true;
  }
  
  // Handle API requests from content script
  if (message.action === 'verifyClaim') {
    console.log('[Background] Verify request:', message.text?.substring(0, 50));
    
    (async () => {
      try {
        const response = await fetch(`${currentSettings.apiEndpoint}/api/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text: message.text,
            context: message.context 
          }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('[Background] Verification result:', data.score);
        sendResponse({ success: true, data });
      } catch (error) {
        console.error('[Background] API Error:', error);
        sendResponse({ 
          success: false, 
          error: error instanceof Error ? error.message : 'API request failed' 
        });
      }
    })();
    
    return true;
  }

  // Toggle extension for current site
  if (message.action === 'toggleCurrentSite') {
    const url = sender.tab?.url || message.url;
    if (!url) {
      sendResponse({ success: false, error: 'No URL provided' });
      return true;
    }

    try {
      const hostname = new URL(url).hostname.replace('www.', '').toLowerCase();
      const isCurrentlyDisabled = currentSettings.disabledSites.includes(hostname);

      if (isCurrentlyDisabled) {
        // Enable: remove from disabled list
        currentSettings.disabledSites = currentSettings.disabledSites.filter(s => s !== hostname);
      } else {
        // Disable: add to disabled list
        currentSettings.disabledSites.push(hostname);
      }

      // Save to storage
      chrome.storage.sync.set({ disabledSites: currentSettings.disabledSites }, () => {
        sendResponse({ 
          success: true, 
          enabled: isCurrentlyDisabled, // Now enabled
          hostname 
        });
      });
    } catch (error) {
      sendResponse({ success: false, error: 'Invalid URL' });
    }
    return true;
  }
});
