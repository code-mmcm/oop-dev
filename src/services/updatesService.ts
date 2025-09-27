/**
 * Service for managing application updates and changelog data
 * JSDoc: Handles CRUD operations for update entries and provides filtering/sorting capabilities
 */

import type { UpdateEntry, UpdateType } from '../types/update';
import { logger } from '../lib/logger';

// Mock data for demonstration - in production this would come from an API or database
const mockUpdates: UpdateEntry[] = [
  {
    id: '1',
    date: '2025-09-27',
    type: 'feature',
    title: 'Complete System Overhaul & Feature Integration',
    description: 'Comprehensive system update with multiple new features and improvements:',
    version: '1.0.0-beta.1',
    priority: 'high',
    userFacing: true,
    metadata: {
      developer: 'Dev Team',
      ticketId: 'PL-100'
    }
  },
];

/**
 * Updates service class for managing update entries
 * JSDoc: Provides methods to fetch, filter, and manage application updates
 */
export class UpdatesService {
  /**
   * Fetches all update entries
   * JSDoc: Retrieves all available update entries, optionally filtered by type
   */
  static async getUpdates(type?: UpdateType): Promise<UpdateEntry[]> {
    try {
      logger.info('Fetching updates', { type });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      let updates = [...mockUpdates];
      
      // Filter by type if specified
      if (type) {
        updates = updates.filter(update => update.type === type);
        logger.debug('Filtered updates by type', { type, count: updates.length });
      }
      
      // Sort by date (newest first)
      updates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      logger.info('Successfully fetched updates', { count: updates.length });
      return updates;
    } catch (error) {
      logger.error('Failed to fetch updates', error);
      throw new Error('Failed to fetch updates');
    }
  }

  /**
   * Fetches updates by date range
   * JSDoc: Retrieves updates within a specific date range
   */
  static async getUpdatesByDateRange(startDate: string, endDate: string): Promise<UpdateEntry[]> {
    try {
      logger.info('Fetching updates by date range', { startDate, endDate });
      
      const updates = await this.getUpdates();
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const filteredUpdates = updates.filter(update => {
        const updateDate = new Date(update.date);
        return updateDate >= start && updateDate <= end;
      });
      
      logger.debug('Filtered updates by date range', { count: filteredUpdates.length });
      return filteredUpdates;
    } catch (error) {
      logger.error('Failed to fetch updates by date range', error);
      throw new Error('Failed to fetch updates by date range');
    }
  }

  /**
   * Gets update statistics
   * JSDoc: Returns summary statistics about updates
   */
  static async getUpdateStats(): Promise<{
    total: number;
    byType: Record<UpdateType, number>;
    byPriority: Record<string, number>;
    recentCount: number;
  }> {
    try {
      logger.info('Calculating update statistics');
      
      const updates = await this.getUpdates();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const stats = {
        total: updates.length,
        byType: updates.reduce((acc, update) => {
          acc[update.type] = (acc[update.type] || 0) + 1;
          return acc;
        }, {} as Record<UpdateType, number>),
        byPriority: updates.reduce((acc, update) => {
          acc[update.priority] = (acc[update.priority] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        recentCount: updates.filter(update => new Date(update.date) >= thirtyDaysAgo).length
      };
      
      logger.info('Update statistics calculated', stats);
      return stats;
    } catch (error) {
      logger.error('Failed to calculate update statistics', error);
      throw new Error('Failed to calculate update statistics');
    }
  }

  /**
   * Adds a new update entry
   * JSDoc: Creates a new update entry (for admin use)
   */
  static async addUpdate(update: Omit<UpdateEntry, 'id'>): Promise<UpdateEntry> {
    try {
      logger.info('Adding new update entry', { title: update.title });
      
      const newUpdate: UpdateEntry = {
        ...update,
        id: Date.now().toString()
      };
      
      // In a real app, this would make an API call
      mockUpdates.unshift(newUpdate);
      
      logger.info('Successfully added update entry', { id: newUpdate.id });
      return newUpdate;
    } catch (error) {
      logger.error('Failed to add update entry', error);
      throw new Error('Failed to add update entry');
    }
  }
}

export default UpdatesService;
