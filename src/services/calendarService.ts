import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import { ListingService } from './listingService';

/**
 * Blocked date range type (for API compatibility)
 * Note: This stores data in the listings table's calendar_settings JSONB column
 */
export interface BlockedDateRange {
  id: string;
  listing_id: string;
  start_date: string;
  end_date: string;
  reason?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Special pricing rule type (for API compatibility)
 * Note: This stores data in the listings table's calendar_settings JSONB column
 */
export interface SpecialPricingRule {
  id: string;
  listing_id: string;
  start_date: string;
  end_date: string;
  price: number;
  note?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Calendar settings structure stored in JSONB column
 */
interface CalendarSettings {
  blocked_dates?: Array<{
    id: string;
    start_date: string;
    end_date: string;
    reason?: string;
    created_at: string;
  }>;
  special_pricing?: Array<{
    id: string;
    start_date: string;
    end_date: string;
    price: number;
    note?: string;
    created_at: string;
  }>;
}

/**
 * Calendar Service
 * Handles blocked dates and special pricing for listings
 * 
 * Uses JSONB column in listings table (calendar_settings) to store data
 * Falls back to localStorage if database column is not available
 */
export class CalendarService {
  /**
   * Get calendar settings from database or localStorage fallback
   * For 'global' listing ID, skip database lookup and use localStorage only
   */
  private static async getCalendarSettings(listingId: string): Promise<CalendarSettings> {
    try {
      // For global settings, use localStorage only (no database lookup)
      if (listingId === 'global') {
        const localStorageKey = `calendar_settings_global`;
        const stored = localStorage.getItem(localStorageKey);
        
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as CalendarSettings;
            logger.info('Global calendar settings loaded from localStorage', { listingId });
            return parsed;
          } catch (e) {
            logger.warn('Failed to parse global calendar settings', { listingId, error: e });
          }
        }
        
        return { blocked_dates: [], special_pricing: [] };
      }
      
      // For regular listings, try to get from database first
      const listing = await ListingService.getListingById(listingId);
      
      if (listing && listing.calendar_settings) {
        logger.info('Calendar settings loaded from database', { listingId });
        return listing.calendar_settings;
      }
      
      // Fallback to localStorage
      const localStorageKey = `calendar_settings_${listingId}`;
      const stored = localStorage.getItem(localStorageKey);
      
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as CalendarSettings;
          logger.info('Calendar settings loaded from localStorage', { listingId });
          return parsed;
        } catch (e) {
          logger.warn('Failed to parse localStorage calendar settings', { listingId, error: e });
        }
      }
      
      // Return empty settings
      return { blocked_dates: [], special_pricing: [] };
    } catch (error) {
      logger.error('Error getting calendar settings, using localStorage fallback', { error, listingId });
      
      // Fallback to localStorage
      const localStorageKey = `calendar_settings_${listingId}`;
      const stored = localStorage.getItem(localStorageKey);
      
      if (stored) {
        try {
          return JSON.parse(stored) as CalendarSettings;
        } catch (e) {
          logger.warn('Failed to parse localStorage calendar settings', { listingId, error: e });
        }
      }
      
      return { blocked_dates: [], special_pricing: [] };
    }
  }

  /**
   * Save calendar settings to database or localStorage fallback
   * For 'global' listing ID, always use localStorage (no database lookup)
   */
  private static async saveCalendarSettings(listingId: string, settings: CalendarSettings): Promise<void> {
    try {
      // For global settings, always use localStorage (no database entry exists)
      if (listingId === 'global') {
        const localStorageKey = `calendar_settings_global`;
        localStorage.setItem(localStorageKey, JSON.stringify(settings));
        logger.info('Global calendar settings saved to localStorage', { listingId });
        return;
      }
      
      // For regular listings, try to save to database first
      const { error } = await supabase
        .from('listings')
        .update({ calendar_settings: settings })
        .eq('id', listingId);
      
      if (!error) {
        logger.info('Calendar settings saved to database', { listingId });
        return;
      }
      
      // If column doesn't exist, fall back to localStorage
      if (error.code === 'PGRST204' || error.message?.includes('column') || error.message?.includes('does not exist')) {
        logger.warn('calendar_settings column not found, using localStorage fallback', { listingId });
        const localStorageKey = `calendar_settings_${listingId}`;
        localStorage.setItem(localStorageKey, JSON.stringify(settings));
        logger.info('Calendar settings saved to localStorage', { listingId });
      } else {
        throw error;
      }
    } catch (error) {
      logger.error('Error saving calendar settings, using localStorage fallback', { error, listingId });
      
      // Fallback to localStorage
      const localStorageKey = `calendar_settings_${listingId}`;
      localStorage.setItem(localStorageKey, JSON.stringify(settings));
      logger.info('Calendar settings saved to localStorage as fallback', { listingId });
    }
  }
  /**
   * Get all blocked date ranges for a listing
   * Retrieves from JSONB column in listings table
   */
  static async getBlockedRanges(listingId: string): Promise<BlockedDateRange[]> {
    try {
      const settings = await this.getCalendarSettings(listingId);
      const blockedDates = settings.blocked_dates || [];
      
      // Convert to BlockedDateRange format for API compatibility
      return blockedDates.map(bd => ({
        id: bd.id,
        listing_id: listingId,
        start_date: bd.start_date,
        end_date: bd.end_date,
        reason: bd.reason,
        created_at: bd.created_at,
        updated_at: bd.created_at // Use created_at as updated_at if not available
      })).sort((a, b) => a.start_date.localeCompare(b.start_date));
    } catch (error) {
      logger.error('Error in getBlockedRanges', { error, listingId });
      throw error;
    }
  }

  /**
   * Add a new blocked date range
   * Stores in JSONB column in listings table
   */
  static async addBlockedRange(
    listingId: string,
    startDate: string,
    endDate: string,
    reason?: string
  ): Promise<BlockedDateRange> {
    try {
      const settings = await this.getCalendarSettings(listingId);
      const blockedDates = settings.blocked_dates || [];
      
      // Create new blocked date entry
      const newEntry = {
        id: `blocked-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        start_date: startDate,
        end_date: endDate,
        reason: reason || undefined,
        created_at: new Date().toISOString()
      };
      
      // Add to array
      blockedDates.push(newEntry);
      
      // Save updated settings
      await this.saveCalendarSettings(listingId, {
        ...settings,
        blocked_dates: blockedDates
      });
      
      logger.info('Blocked range added successfully', { listingId, id: newEntry.id });
      
      // Return in BlockedDateRange format
      return {
        id: newEntry.id,
        listing_id: listingId,
        start_date: newEntry.start_date,
        end_date: newEntry.end_date,
        reason: newEntry.reason,
        created_at: newEntry.created_at,
        updated_at: newEntry.created_at
      };
    } catch (error) {
      logger.error('Error in addBlockedRange', { error, listingId });
      throw error;
    }
  }

  /**
   * Remove a blocked date range
   * Removes from JSONB column in listings table
   */
  static async removeBlockedRange(listingId: string, rangeId: string): Promise<void> {
    try {
      const settings = await this.getCalendarSettings(listingId);
      const blockedDates = settings.blocked_dates || [];
      
      // Filter out the range to remove
      const updatedBlockedDates = blockedDates.filter(bd => bd.id !== rangeId);
      
      // Save updated settings
      await this.saveCalendarSettings(listingId, {
        ...settings,
        blocked_dates: updatedBlockedDates
      });
      
      logger.info('Blocked range removed successfully', { listingId, rangeId });
    } catch (error) {
      logger.error('Error in removeBlockedRange', { error, listingId, rangeId });
      throw error;
    }
  }

  /**
   * Get all special pricing rules for a listing
   * Retrieves from JSONB column in listings table
   */
  static async getPricingRules(listingId: string): Promise<SpecialPricingRule[]> {
    try {
      const settings = await this.getCalendarSettings(listingId);
      const pricingRules = settings.special_pricing || [];
      
      // Convert to SpecialPricingRule format for API compatibility
      return pricingRules.map(pr => ({
        id: pr.id,
        listing_id: listingId,
        start_date: pr.start_date,
        end_date: pr.end_date,
        price: pr.price,
        note: pr.note,
        created_at: pr.created_at,
        updated_at: pr.created_at // Use created_at as updated_at if not available
      })).sort((a, b) => a.start_date.localeCompare(b.start_date));
    } catch (error) {
      logger.error('Error in getPricingRules', { error, listingId });
      throw error;
    }
  }

  /**
   * Add a new special pricing rule
   * Stores in JSONB column in listings table
   */
  static async addPricingRule(
    listingId: string,
    startDate: string,
    endDate: string,
    price: number,
    note?: string
  ): Promise<SpecialPricingRule> {
    try {
      const settings = await this.getCalendarSettings(listingId);
      const pricingRules = settings.special_pricing || [];
      
      // Create new pricing rule entry
      const newEntry = {
        id: `pricing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        start_date: startDate,
        end_date: endDate,
        price: price,
        note: note || undefined,
        created_at: new Date().toISOString()
      };
      
      // Add to array
      pricingRules.push(newEntry);
      
      // Save updated settings
      await this.saveCalendarSettings(listingId, {
        ...settings,
        special_pricing: pricingRules
      });
      
      logger.info('Pricing rule added successfully', { listingId, id: newEntry.id });
      
      // Return in SpecialPricingRule format
      return {
        id: newEntry.id,
        listing_id: listingId,
        start_date: newEntry.start_date,
        end_date: newEntry.end_date,
        price: newEntry.price,
        note: newEntry.note,
        created_at: newEntry.created_at,
        updated_at: newEntry.created_at
      };
    } catch (error) {
      logger.error('Error in addPricingRule', { error, listingId });
      throw error;
    }
  }

  /**
   * Remove a special pricing rule
   * Removes from JSONB column in listings table
   */
  static async removePricingRule(listingId: string, ruleId: string): Promise<void> {
    try {
      const settings = await this.getCalendarSettings(listingId);
      const pricingRules = settings.special_pricing || [];
      
      // Filter out the rule to remove
      const updatedPricingRules = pricingRules.filter(pr => pr.id !== ruleId);
      
      // Save updated settings
      await this.saveCalendarSettings(listingId, {
        ...settings,
        special_pricing: updatedPricingRules
      });
      
      logger.info('Pricing rule removed successfully', { listingId, ruleId });
    } catch (error) {
      logger.error('Error in removePricingRule', { error, listingId, ruleId });
      throw error;
    }
  }

  /**
   * Check if a date is blocked for a listing
   * Checks against JSONB column in listings table
   * Also checks global blocked dates (listing_id = 'global') which apply to all listings
   */
  static async isDateBlocked(listingId: string, date: string): Promise<boolean> {
    try {
      // Check listing-specific blocked dates
      const settings = await this.getCalendarSettings(listingId);
      const blockedDates = settings.blocked_dates || [];
      
      // Check global blocked dates (apply to all listings)
      const globalSettings = await this.getCalendarSettings('global');
      const globalBlockedDates = globalSettings.blocked_dates || [];
      
      // Combine both lists
      const allBlockedDates = [...blockedDates, ...globalBlockedDates];
      
      // Check if date falls within any blocked range
      const isBlocked = allBlockedDates.some(bd => {
        const startDate = new Date(bd.start_date);
        const endDate = new Date(bd.end_date);
        const checkDate = new Date(date);
        
        // Reset time to midnight for date comparison
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        checkDate.setHours(0, 0, 0, 0);
        
        return checkDate >= startDate && checkDate <= endDate;
      });
      
      return isBlocked;
    } catch (error) {
      logger.error('Error in isDateBlocked', { error, listingId, date });
      return false;
    }
  }

  /**
   * Check if any date in a range is blocked
   * Returns true if there's any overlap between the requested range and blocked ranges
   * Checks against JSONB column in listings table
   * Also checks global blocked dates (listing_id = 'global') which apply to all listings
   */
  static async isDateRangeBlocked(listingId: string, startDate: string, endDate: string): Promise<boolean> {
    try {
      // Check listing-specific blocked dates
      const settings = await this.getCalendarSettings(listingId);
      const blockedDates = settings.blocked_dates || [];
      
      // Check global blocked dates (apply to all listings)
      const globalSettings = await this.getCalendarSettings('global');
      const globalBlockedDates = globalSettings.blocked_dates || [];
      
      // Combine both lists
      const allBlockedDates = [...blockedDates, ...globalBlockedDates];
      
      const requestStart = new Date(startDate);
      const requestEnd = new Date(endDate);
      requestStart.setHours(0, 0, 0, 0);
      requestEnd.setHours(0, 0, 0, 0);
      
      // Check for overlap: blocked range overlaps if:
      // blocked.start <= requested.end AND blocked.end >= requested.start
      const hasOverlap = allBlockedDates.some(bd => {
        const blockedStart = new Date(bd.start_date);
        const blockedEnd = new Date(bd.end_date);
        blockedStart.setHours(0, 0, 0, 0);
        blockedEnd.setHours(0, 0, 0, 0);
        
        return blockedStart <= requestEnd && blockedEnd >= requestStart;
      });
      
      return hasOverlap;
    } catch (error) {
      logger.error('Error in isDateRangeBlocked', { error, listingId });
      return false;
    }
  }

  /**
   * Get special pricing for a specific date (if any)
   * Checks against JSONB column in listings table
   */
  static async getPriceForDate(listingId: string, date: string): Promise<number | null> {
    try {
      const settings = await this.getCalendarSettings(listingId);
      const pricingRules = settings.special_pricing || [];
      
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      
      // Find pricing rules that apply to this date, sorted by created_at (most recent first)
      const applicableRules = pricingRules
        .filter(pr => {
          const ruleStart = new Date(pr.start_date);
          const ruleEnd = new Date(pr.end_date);
          ruleStart.setHours(0, 0, 0, 0);
          ruleEnd.setHours(0, 0, 0, 0);
          
          return checkDate >= ruleStart && checkDate <= ruleEnd;
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      // Return the price from the most recent applicable rule
      return applicableRules.length > 0 ? applicableRules[0].price : null;
    } catch (error) {
      logger.error('Error in getPriceForDate', { error, listingId, date });
      return null;
    }
  }
}

