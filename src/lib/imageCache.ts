import crypto from 'crypto';

export interface CacheItem {
  data: Buffer;
  timestamp: number;
  contentType: string;
}

// Simple in-memory cache for cropped images
class ImageCache {
  private cache = new Map<string, CacheItem>();
  private maxAge = 3600000; // 1 hour in milliseconds
  private maxSize = 100; // Maximum number of cached items

  generateKey(docId: string, field: string, padding: number): string {
    return crypto
      .createHash('sha256')
      .update(`${docId}:${field}:${padding}`)
      .digest('hex');
  }

  set(key: string, data: Buffer, contentType: string = 'image/jpeg'): void {
    // Clear old items if cache is full
    if (this.cache.size >= this.maxSize) {
      this.clearOldItems();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      contentType,
    });
  }

  get(key: string): CacheItem | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return item;
  }

  private clearOldItems(): void {
    const now = Date.now();
    const itemsToDelete: string[] = [];

    // Find expired items
    this.cache.forEach((item, key) => {
      if (now - item.timestamp > this.maxAge) {
        itemsToDelete.push(key);
      }
    });

    // Delete expired items
    itemsToDelete.forEach(key => this.cache.delete(key));

    // If still at capacity, remove oldest items
    if (this.cache.size >= this.maxSize) {
      const entries: [string, CacheItem][] = [];
      this.cache.forEach((item, key) => {
        entries.push([key, item]);
      });
      
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, Math.floor(this.maxSize * 0.2)); // Remove 20%
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; maxSize: number; maxAge: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      maxAge: this.maxAge,
    };
  }
}

// Singleton cache instance
export const imageCache = new ImageCache();
