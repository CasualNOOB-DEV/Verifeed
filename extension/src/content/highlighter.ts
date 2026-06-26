/**
 * DOM Highlighter
 * Scans the page and highlights claim text
 */

import { ClaimDetector } from './claim-detector';

export interface HighlightedClaim {
  id: string;
  text: string;
  element: HTMLElement;
  surroundingText?: string; // Context around the claim
}

export class Highlighter {
  private claims: Map<string, HighlightedClaim> = new Map();
  private processedNodes: Set<Node> = new Set();
  private observer: MutationObserver | null = null;

  private static readonly HIGHLIGHT_CLASS = 'verifeed-claim-highlight';
  private static readonly CONTAINER_CLASS = 'verifeed-highlight-container';

  // Any node matching this selector (or inside it) is extension-created
  // UI and must NEVER be scanned/highlighted, or the observer loops forever.
  private static readonly IGNORE_SELECTOR =
    '.verifeed-claim-highlight, .verifeed-popup, #verifeed-popup, #verifeed-simple-popup';

  // Elements to skip
  private static readonly SKIP_TAGS = new Set([
    'SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'OBJECT', 'EMBED',
    'CODE', 'PRE', 'SVG', 'CANVAS'
  ]);

  /**
   * Initialize the highlighter and scan the page
   */
  init() {
    this.scanPage();
    this.observeChanges();
  }

  /**
   * Returns true if a node is (or lives inside) extension-created UI.
   * This is the key guard that prevents the observer from re-processing
   * our own injected highlights and popups (infinite loop protection).
   */
  private isVerifeedNode(node: Node): boolean {
    const el: Element | null =
      node.nodeType === Node.ELEMENT_NODE
        ? (node as Element)
        : node.parentElement;
    if (!el) return false;
    return !!el.closest(Highlighter.IGNORE_SELECTOR);
  }

  /**
   * Scan the entire page for claims
   */
  private scanPage() {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip if already processed
          if (this.processedNodes.has(node)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Skip certain elements
          const parent = node.parentElement;
          if (!parent || Highlighter.SKIP_TAGS.has(parent.tagName)) {
            return NodeFilter.FILTER_REJECT;
          }

          // Skip if already highlighted
          if (parent.closest(`.${Highlighter.HIGHLIGHT_CLASS}`)) {
            return NodeFilter.FILTER_REJECT;
          }

          // Must have meaningful text
          const text = node.textContent?.trim() || '';
          if (text.length < 20) {
            return NodeFilter.FILTER_REJECT;
          }

          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const textNodes: Text[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      textNodes.push(node as Text);
      this.processedNodes.add(node);
    }

    // Process each text node
    for (const textNode of textNodes) {
      this.highlightTextNode(textNode);
    }

    console.log(`[Verifeed] Found ${this.claims.size} claims on page`);
  }

  /**
   * Highlight ALL claims within a text node
   */
  private highlightTextNode(textNode: Text) {
    const text = textNode.textContent || '';
    const claims = ClaimDetector.detectClaims(text);

    if (claims.length === 0) return;

    const parent = textNode.parentElement;
    if (!parent) return;

    // Never highlight inside our own UI (extra safety).
    if (this.isVerifeedNode(textNode)) return;

    try {
      // Pause the observer while WE mutate the DOM
      this.observer?.disconnect();

      // Sort claims by their position in the text (earliest first)
      const sortedClaims = claims
        .map(claim => ({ claim, index: text.indexOf(claim.text) }))
        .filter(c => c.index !== -1)
        .sort((a, b) => a.index - b.index);

      if (sortedClaims.length === 0) {
        this.reconnectObserver();
        return;
      }

      // Build a document fragment with all claims highlighted
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;

      for (const { claim, index } of sortedClaims) {
        // Add text before this claim
        if (index > lastIndex) {
          const beforeNode = document.createTextNode(text.substring(lastIndex, index));
          fragment.appendChild(beforeNode);
          this.processedNodes.add(beforeNode);
        }

        // Create the highlight element
        const highlight = document.createElement('span');
        highlight.className = Highlighter.HIGHLIGHT_CLASS;
        const claimId = this.generateId();
        highlight.setAttribute('data-claim-id', claimId);
        highlight.setAttribute('data-confidence', claim.confidence.toString());
        highlight.title = `Click to verify (Confidence: ${claim.confidence}%)`;
        highlight.textContent = claim.text;

        fragment.appendChild(highlight);
        this.processedNodes.add(highlight);
        if (highlight.firstChild) {
          this.processedNodes.add(highlight.firstChild);
        }

        // Get surrounding text for context (up to 200 chars before and after)
        const contextStart = Math.max(0, index - 200);
        const contextEnd = Math.min(text.length, index + claim.text.length + 200);
        const surroundingText = text.substring(contextStart, contextEnd);

        // Store the claim with context
        this.claims.set(claimId, {
          id: claimId,
          text: claim.text,
          element: highlight,
          surroundingText,
        });

        // Add click handler
        highlight.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          this.handleClaimClick(claimId);
        });

        lastIndex = index + claim.text.length;
      }

      // Add any remaining text after the last claim
      if (lastIndex < text.length) {
        const afterNode = document.createTextNode(text.substring(lastIndex));
        fragment.appendChild(afterNode);
        this.processedNodes.add(afterNode);
      }

      // Replace the original text node with the fragment
      parent.replaceChild(fragment, textNode);

      // Re-attach the observer now that our mutations are done.
      this.reconnectObserver();

    } catch (error) {
      // Make sure the observer is always reconnected even on failure.
      this.reconnectObserver();
      console.warn('[Verifeed] Failed to highlight claim:', error);
    }
  }

  /**
   * Handle clicking on a highlighted claim
   */
  private handleClaimClick(claimId: string) {
    const claim = this.claims.get(claimId);
    if (!claim) return;

    // Dispatch custom event that the popup component will listen to
    const event = new CustomEvent('verifeed:claim-clicked', {
      detail: {
        id: claim.id,
        text: claim.text,
        element: claim.element,
        surroundingText: claim.surroundingText,
        pageContext: {
          url: window.location.href,
          title: document.title,
          siteName: this.extractSiteName(),
        },
      },
    });
    document.dispatchEvent(event);
  }

  /**
   * Observe DOM changes and highlight new content
   */
  private observeChanges() {
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type !== 'childList') continue;

        mutation.addedNodes.forEach((node) => {
          // CRITICAL: never process our own injected highlights/popups.
          // This is what stops the infinite observer feedback loop.
          if (this.isVerifeedNode(node)) return;

          if (node.nodeType === Node.TEXT_NODE) {
            if (!this.processedNodes.has(node)) {
              this.processedNodes.add(node);
              this.highlightTextNode(node as Text);
            }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            // Scan new element subtree
            this.scanElement(node as Element);
          }
        });
      }
    });

    this.reconnectObserver();
  }

  /**
   * (Re)attach the MutationObserver to the body.
   */
  private reconnectObserver() {
    this.observer?.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Scan a specific element for claims
   */
  private scanElement(element: Element) {
    // Skip extension-created subtrees entirely.
    if (this.isVerifeedNode(element)) return;

    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          if (this.processedNodes.has(node)) {
            return NodeFilter.FILTER_REJECT;
          }
          const parent = node.parentElement;
          if (!parent || Highlighter.SKIP_TAGS.has(parent.tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          // MISSING CHECK (root-cause bug): skip text already inside a
          // highlight or any extension UI, otherwise we re-highlight forever.
          if (parent.closest(Highlighter.IGNORE_SELECTOR)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    // Collect first, then mutate — never mutate the DOM while the
    // TreeWalker is still iterating over it.
    const textNodes: Text[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      textNodes.push(node as Text);
      this.processedNodes.add(node);
    }

    for (const textNode of textNodes) {
      this.highlightTextNode(textNode);
    }
  }

  /**
   * Generate unique ID for claims
   */
  private generateId(): string {
    return `claim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extract site name from meta tags or URL
   */
  private extractSiteName(): string {
    // Try Open Graph site_name
    const ogSiteName = document.querySelector('meta[property="og:site_name"]');
    if (ogSiteName) {
      return ogSiteName.getAttribute('content') || '';
    }
    
    // Try application-name
    const appName = document.querySelector('meta[name="application-name"]');
    if (appName) {
      return appName.getAttribute('content') || '';
    }
    
    // Fall back to hostname
    return window.location.hostname.replace('www.', '');
  }

  /**
   * Get claim by ID
   */
  getClaim(id: string): HighlightedClaim | undefined {
    return this.claims.get(id);
  }
}
