const supabase = require('../config/supabase');
const logger = require('./logger');

class CacheManager {
  constructor() {
    this.defaultTTL = 3600; // 1 hour in seconds
  }

  async get(key) {
    try {
      const { data, error } = await supabase
        .from('cache')
        .select('value, expires_at')
        .eq('key', key)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw error;
      }

      // Check if cache has expired
      const now = new Date();
      const expiresAt = new Date(data.expires_at);
      
      if (now > expiresAt) {
        // Cache expired, delete it
        await this.delete(key);
        return null;
      }

      logger.debug(`Cache hit for key: ${key}`);
      return data.value;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key, value, ttlSeconds = null) {
    try {
      const ttl = ttlSeconds || this.defaultTTL;
      const expiresAt = new Date(Date.now() + ttl * 1000);

      const { error } = await supabase
        .from('cache')
        .upsert({
          key,
          value,
          expires_at: expiresAt.toISOString()
        });

      if (error) {
        throw error;
      }

      logger.debug(`Cache set for key: ${key}, TTL: ${ttl}s`);
      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async delete(key) {
    try {
      const { error } = await supabase
        .from('cache')
        .delete()
        .eq('key', key);

      if (error) {
        throw error;
      }

      logger.debug(`Cache deleted for key: ${key}`);
      return true;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  async clear() {
    try {
      const { error } = await supabase
        .from('cache')
        .delete()
        .neq('key', ''); // Delete all rows

      if (error) {
        throw error;
      }

      logger.info('Cache cleared');
      return true;
    } catch (error) {
      logger.error('Cache clear error:', error);
      return false;
    }
  }

  // Clean up expired cache entries
  async cleanup() {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('cache')
        .delete()
        .lt('expires_at', now);

      if (error) {
        throw error;
      }

      logger.info('Cache cleanup completed');
      return true;
    } catch (error) {
      logger.error('Cache cleanup error:', error);
      return false;
    }
  }
}

module.exports = new CacheManager();

