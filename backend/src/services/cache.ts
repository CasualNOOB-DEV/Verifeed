/**
 * Simple in-memory cache for verification results
 * Prevents duplicate API calls for the same claims
 */

import { VerificationResponse } from '../types';

interface CacheEntry {
  result: VerificationResponse;
  timestamp: number;
}

export class VerificationCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly TTL = 1000 * 60 * 60; // 1 hour
  private readonly MAX_SIZE = 1000; // Max cached items

  /**
   * Get cached result if available and not expired
   */
  get(text: string): VerificationResponse | null {
    const key = this.generateKey(text);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    console.log('[Cache] Hit for:', text.substring(0, 50));
    return entry.result;
  }

  /**
   * Store result in cache
   */
  set(text: string, result: VerificationResponse): void {
    const key = this.generateKey(text);

    // Evict oldest entries if cache is full
    if (this.cache.size >= this.MAX_SIZE) {
      this.evictOldest();
    }

    this.cache.set(key, {
      result,
      timestamp: Date.now(),
    });

    console.log('[Cache] Stored result for:', text.substring(0, 50));
  }

  /**
   * Generate cache key from text
   */
  private generateKey(text: string): string {
    // Normalize text: lowercase, trim, remove extra spaces
    return text.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  /**
   * Evict oldest cache entries
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      console.log('[Cache] Evicted oldest entry');
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    console.log('[Cache] Cleared all entries');
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.MAX_SIZE,
      ttl: this.TTL,
    };
  }
}
