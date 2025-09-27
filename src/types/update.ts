/**
 * Type definitions for update logs and changelog entries
 * JSDoc: Defines the structure for tracking application updates, bug fixes, and new features
 */

export type UpdateType = 'bug' | 'feature' | 'fix' | 'enhancement' | 'security' | 'performance' | 'breaking';

export interface UpdateEntry {
  /** Unique identifier for the update entry */
  id: string;
  /** Date when the update was made */
  date: string;
  /** Type of update (bug fix, new feature, etc.) */
  type: UpdateType;
  /** Brief title/description of the update */
  title: string;
  /** Detailed description of what was changed */
  description: string;
  /** Version number if applicable */
  version?: string;
  /** Priority level of the update */
  priority: 'low' | 'medium' | 'high' | 'critical';
  /** Whether this update affects user-facing functionality */
  userFacing: boolean;
  /** Additional metadata about the update */
  metadata?: {
    /** Files or components affected */
    affectedFiles?: string[];
    /** Developer who made the change */
    developer?: string;
    /** Related issue or ticket number */
    ticketId?: string;
  };
}

export interface UpdatesState {
  /** Array of all update entries */
  updates: UpdateEntry[];
  /** Whether updates are currently being loaded */
  loading: boolean;
  /** Error message if loading failed */
  error: string | null;
}