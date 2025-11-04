import React, { useState, useEffect } from 'react';
import { logger } from '../../../lib/logger';
import SingleDatePicker from './SingleDatePicker';
import { CalendarService } from '../../../services/calendarService';
import type { BlockedDateRange, SpecialPricingRule } from '../../../services/calendarService';

/**
 * Local blocked date range type (for UI state)
 */
type LocalBlockedDateRange = {
  id: string;
  startDate: string;
  endDate: string;
  reason?: string;
};

/**
 * Local special pricing rule type (for UI state)
 */
type LocalSpecialPricingRule = {
  id: string;
  startDate: string;
  endDate: string;
  price: number;
  note?: string;
};

interface CalendarSettingsModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Unit/listing ID for which settings are being configured. Use null for global (all units) settings */
  unitId?: string | null;
  /** Whether to show special pricing section (default: true) */
  showSpecialPricing?: boolean;
  /** Whether this is for global settings (applies to all units) */
  isGlobal?: boolean;
}

/**
 * CalendarSettingsModal Component
 * 
 * Modal for managing unit calendar settings including:
 * - Blocked dates with optional reasons
 * - Special pricing rules with optional notes
 * 
 * Follows the existing app design theme with consistent colors, typography, and component styles.
 */
const CalendarSettingsModal: React.FC<CalendarSettingsModalProps> = ({
  isOpen,
  onClose,
  unitId,
  showSpecialPricing = true,
  isGlobal = false
}) => {
  // Blocked dates state
  const [blockedStartDate, setBlockedStartDate] = useState<string>('');
  const [blockedEndDate, setBlockedEndDate] = useState<string>('');
  const [blockedReason, setBlockedReason] = useState<string>('');
  const [blockedRanges, setBlockedRanges] = useState<LocalBlockedDateRange[]>([]);

  // Special pricing state
  const [pricingStartDate, setPricingStartDate] = useState<string>('');
  const [pricingEndDate, setPricingEndDate] = useState<string>('');
  const [pricingPrice, setPricingPrice] = useState<string>('');
  const [pricingNote, setPricingNote] = useState<string>('');
  const [pricingRules, setPricingRules] = useState<LocalSpecialPricingRule[]>([]);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Handle saving blocked date range
   * Saves to database via CalendarService
   * For global settings, saves to a special global listing ID
   */
  const handleSaveBlockedRange = async () => {
    if (unitId === undefined) {
      logger.warn('Unit ID is required to save blocked date range');
      return;
    }
    
    if (!blockedStartDate || !blockedEndDate) {
      logger.warn('Blocked date range requires both start and end dates');
      return;
    }

    setIsSaving(true);
    try {
      // Use 'global' as listing ID for global blocked dates
      const targetListingId = isGlobal ? 'global' : unitId;
      
      // Save to database
      const savedRange = await CalendarService.addBlockedRange(
        targetListingId,
        blockedStartDate,
        blockedEndDate,
        blockedReason.trim() || undefined
      );

      // Convert to local format and update state
      const newRange: LocalBlockedDateRange = {
        id: savedRange.id,
        startDate: savedRange.start_date,
        endDate: savedRange.end_date,
        reason: savedRange.reason
      };

      setBlockedRanges([...blockedRanges, newRange]);
      setBlockedStartDate('');
      setBlockedEndDate('');
      setBlockedReason('');
      logger.info('Blocked date range saved successfully', { range: newRange });
    } catch (error) {
      logger.error('Error saving blocked date range', { error, unitId });
      // TODO: Show error toast to user
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle removing blocked date range
   * Removes from database via CalendarService
   */
  const handleRemoveBlockedRange = async (id: string) => {
    if (unitId === undefined) {
      logger.warn('Unit ID is required to remove blocked date range');
      return;
    }
    
    setIsSaving(true);
    try {
      // Use 'global' as listing ID for global blocked dates
      const targetListingId = isGlobal ? 'global' : unitId;
      
      // Remove from database
      await CalendarService.removeBlockedRange(targetListingId, id);
      
      // Update local state
      setBlockedRanges(blockedRanges.filter(range => range.id !== id));
      logger.info('Blocked date range removed successfully', { id, unitId });
    } catch (error) {
      logger.error('Error removing blocked date range', { error, id, unitId });
      // TODO: Show error toast to user
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle saving special pricing rule
   * Saves to database via CalendarService
   */
  const handleSavePricingRule = async () => {
    if (unitId === undefined) {
      logger.warn('Unit ID is required to save pricing rule');
      return;
    }
    
    if (!showSpecialPricing) {
      logger.warn('Special pricing is disabled for this modal');
      return;
    }
    
    if (!pricingStartDate || !pricingEndDate || !pricingPrice) {
      logger.warn('Special pricing requires start date, end date, and price');
      return;
    }

    const price = parseFloat(pricingPrice.replace(/[₱,]/g, ''));
    if (isNaN(price) || price <= 0) {
      logger.warn('Invalid price value');
      return;
    }

    setIsSaving(true);
    try {
      // Use 'global' as listing ID for global pricing (though global pricing shouldn't be used)
      const targetListingId = isGlobal ? 'global' : unitId;
      
      // Save to database
      const savedRule = await CalendarService.addPricingRule(
        targetListingId,
        pricingStartDate,
        pricingEndDate,
        price,
        pricingNote.trim() || undefined
      );

      // Convert to local format and update state
      const newRule: LocalSpecialPricingRule = {
        id: savedRule.id,
        startDate: savedRule.start_date,
        endDate: savedRule.end_date,
        price: savedRule.price,
        note: savedRule.note
      };

      setPricingRules([...pricingRules, newRule]);
      setPricingStartDate('');
      setPricingEndDate('');
      setPricingPrice('');
      setPricingNote('');
      logger.info('Special pricing rule saved successfully', { rule: newRule });
    } catch (error) {
      logger.error('Error saving pricing rule', { error, unitId });
      // TODO: Show error toast to user
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle removing special pricing rule
   * Removes from database via CalendarService
   */
  const handleRemovePricingRule = async (id: string) => {
    if (unitId === undefined) {
      logger.warn('Unit ID is required to remove pricing rule');
      return;
    }
    
    setIsSaving(true);
    try {
      // Use 'global' as listing ID for global pricing
      const targetListingId = isGlobal ? 'global' : unitId;
      
      // Remove from database
      await CalendarService.removePricingRule(targetListingId, id);
      
      // Update local state
      setPricingRules(pricingRules.filter(rule => rule.id !== id));
      logger.info('Special pricing rule removed successfully', { id, unitId });
    } catch (error) {
      logger.error('Error removing pricing rule', { error, id, unitId });
      // TODO: Show error toast to user
    } finally {
      setIsSaving(false);
    }
  };

  // Format date for display
  const formatDateDisplay = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return `₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  /**
   * Handle save and close
   * All changes are already saved individually, so we just close
   */
  const handleSaveAndClose = () => {
    logger.info('Calendar settings modal closed', {
      unitId,
      blockedRangesCount: blockedRanges.length,
      pricingRulesCount: pricingRules.length
    });
    onClose();
  };

  /**
   * Load calendar settings when modal opens
   */
  useEffect(() => {
    if (isOpen && unitId !== undefined) {
      setIsLoading(true);
      
      const loadSettings = async () => {
        try {
          // Use 'global' as listing ID for global blocked dates
          const targetListingId = isGlobal ? 'global' : unitId;
          
          // Load blocked dates
          const blockedRangesData = await CalendarService.getBlockedRanges(targetListingId);
          const localBlockedRanges: LocalBlockedDateRange[] = blockedRangesData.map(bd => ({
            id: bd.id,
            startDate: bd.start_date,
            endDate: bd.end_date,
            reason: bd.reason
          }));
          setBlockedRanges(localBlockedRanges);
          
          // Load pricing rules only if special pricing is enabled
          if (showSpecialPricing) {
            const pricingRulesData = await CalendarService.getPricingRules(targetListingId);
            const localPricingRules: LocalSpecialPricingRule[] = pricingRulesData.map(pr => ({
              id: pr.id,
              startDate: pr.start_date,
              endDate: pr.end_date,
              price: pr.price,
              note: pr.note
            }));
            setPricingRules(localPricingRules);
          } else {
            setPricingRules([]);
          }
          
          logger.info('Calendar settings loaded successfully', { 
            unitId: targetListingId, 
            isGlobal,
            blockedCount: localBlockedRanges.length,
            pricingCount: showSpecialPricing ? pricingRules.length : 0
          });
        } catch (error) {
          logger.error('Error loading calendar settings', { error, unitId: targetListingId, isGlobal });
          // Settings will default to empty arrays
        } finally {
          setIsLoading(false);
        }
      };
      
      loadSettings();
    } else if (isOpen && unitId === undefined) {
      // Reset state if no unitId
      setBlockedRanges([]);
      setPricingRules([]);
      setIsLoading(false);
    }
  }, [isOpen, unitId, isGlobal, showSpecialPricing]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      // Lock body scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        // Restore body scroll
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]" 
      onClick={onClose}
      style={{ 
        overflow: 'visible',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)'
      }}
    >
      <div 
        className="bg-white rounded-xl max-w-6xl w-full mx-4 flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          fontFamily: 'Poppins',
          display: 'flex',
          flexDirection: 'column',
          height: '80vh',
          maxHeight: '80vh',
          overflow: 'hidden' // Required for flex children with overflow to work properly
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200" style={{ flexShrink: 0 }}>
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins' }}>
            {isGlobal ? 'Global Calendar Settings' : 'Unit Calendar Settings'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-all duration-200 p-1 cursor-pointer hover:scale-110 active:scale-95"
            aria-label="Close modal"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div 
          className="px-6 py-4" 
          style={{ 
            flex: '1 1 0%', // Explicit flex-grow, flex-shrink, flex-basis
            overflow: 'hidden', // Prevent overflow on parent
            minHeight: 0, // Critical for flex child to respect overflow
          }}
        >
          {/* Two-column layout */}
          <div className="flex gap-6 h-full">
            {/* Left panel: Main form */}
            <div 
              className="flex-1 overflow-y-auto overflow-x-hidden"
              style={{
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              <div className="space-y-4 pr-2">
              {/* Section 1: Blocked Dates */}
              <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2.5" style={{ fontFamily: 'Poppins' }}>
              Blocked Dates
            </h3>
            
            {/* Input fields */}
            <div className="bg-gray-50 rounded-lg p-3.5 mb-3 space-y-2.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-0.5" style={{ fontFamily: 'Poppins' }}>
                    Start Date
                  </label>
                  <SingleDatePicker
                    value={blockedStartDate}
                    onChange={(date) => {
                      setBlockedStartDate(date);
                      // If end date is before new start date, clear it
                      if (blockedEndDate && date && blockedEndDate < date) {
                        setBlockedEndDate('');
                      }
                    }}
                    placeholder="Select start date"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-0.5" style={{ fontFamily: 'Poppins' }}>
                    End Date
                  </label>
                  <SingleDatePicker
                    value={blockedEndDate}
                    onChange={(date) => setBlockedEndDate(date)}
                    minDate={blockedStartDate || undefined}
                    placeholder="Select end date"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-0.5" style={{ fontFamily: 'Poppins' }}>
                  Reason (Optional)
                </label>
                <input
                  type="text"
                  value={blockedReason}
                  onChange={(e) => setBlockedReason(e.target.value)}
                  placeholder="e.g., Maintenance, Private event"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B5858] focus:border-transparent transition-all"
                  style={{ fontFamily: 'Poppins' }}
                />
              </div>

              <button
                onClick={handleSaveBlockedRange}
                disabled={!blockedStartDate || !blockedEndDate || isSaving || isLoading}
                className="px-4 py-1.5 text-sm bg-[#0B5858] text-white rounded-lg font-medium hover:bg-[#094b4b] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:shadow-md active:scale-95 disabled:hover:shadow-none disabled:active:scale-100"
                style={{ fontFamily: 'Poppins' }}
              >
                {isSaving ? 'Saving...' : 'Save Blocked Range'}
              </button>
            </div>
          </section>

          {/* Section 2: Special Pricing - Only show if enabled */}
          {showSpecialPricing && (
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2.5" style={{ fontFamily: 'Poppins' }}>
              Special Pricing
            </h3>
            
            {/* Input fields */}
            <div className="bg-gray-50 rounded-lg p-3.5 mb-3 space-y-2.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-0.5" style={{ fontFamily: 'Poppins' }}>
                    Start Date
                  </label>
                  <SingleDatePicker
                    value={pricingStartDate}
                    onChange={(date) => {
                      setPricingStartDate(date);
                      // If end date is before new start date, clear it
                      if (pricingEndDate && date && pricingEndDate < date) {
                        setPricingEndDate('');
                      }
                    }}
                    placeholder="Select start date"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-0.5" style={{ fontFamily: 'Poppins' }}>
                    End Date
                  </label>
                  <SingleDatePicker
                    value={pricingEndDate}
                    onChange={(date) => setPricingEndDate(date)}
                    minDate={pricingStartDate || undefined}
                    placeholder="Select end date"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-0.5" style={{ fontFamily: 'Poppins' }}>
                    Price
                  </label>
                  <input
                    type="text"
                    value={pricingPrice}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, '');
                      setPricingPrice(value);
                    }}
                    placeholder="₱"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B5858] focus:border-transparent transition-all"
                    style={{ fontFamily: 'Poppins' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-0.5" style={{ fontFamily: 'Poppins' }}>
                    Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={pricingNote}
                    onChange={(e) => setPricingNote(e.target.value)}
                    placeholder="e.g., Holiday pricing, Peak season"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B5858] focus:border-transparent transition-all"
                    style={{ fontFamily: 'Poppins' }}
                  />
                </div>
              </div>

              <button
                onClick={handleSavePricingRule}
                disabled={!pricingStartDate || !pricingEndDate || !pricingPrice || isSaving || isLoading}
                className="px-4 py-1.5 text-sm bg-[#0B5858] text-white rounded-lg font-medium hover:bg-[#094b4b] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:shadow-md active:scale-95 disabled:hover:shadow-none disabled:active:scale-100"
                style={{ fontFamily: 'Poppins' }}
              >
                {isSaving ? 'Saving...' : 'Save Pricing Rule'}
              </button>
            </div>
          </section>
          )}
              </div>
            </div>

            {/* Right panel: Sidebar with summaries */}
            <div 
              className="w-80 flex-shrink-0 bg-gray-50 border-l border-gray-200 overflow-y-auto overflow-x-hidden"
              style={{
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              <div className="p-4 space-y-6">
                {/* Blocked Dates Summary */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Poppins' }}>
                    Blocked Dates
                  </h3>
                  {blockedRanges.length > 0 ? (
                    <div className="space-y-1.5">
                      {blockedRanges.map((range) => (
                        <div 
                          key={range.id} 
                          className="bg-white border border-gray-200 rounded-lg p-2 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-gray-900 mb-0.5" style={{ fontFamily: 'Poppins' }}>
                                {formatDateDisplay(range.startDate)} – {formatDateDisplay(range.endDate)}
                              </div>
                              {range.reason && (
                                <div className="text-[11px] text-gray-600 leading-tight" style={{ fontFamily: 'Poppins' }}>
                                  {range.reason}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => handleRemoveBlockedRange(range.id)}
                              className="transition-all duration-200 p-1 flex-shrink-0 cursor-pointer hover:scale-110 active:scale-95 rounded"
                              style={{ 
                                color: '#B84C4C',
                                fontFamily: 'Poppins'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#9A3E3E';
                                e.currentTarget.style.backgroundColor = 'rgba(184, 76, 76, 0.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = '#B84C4C';
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                              aria-label="Remove blocked range"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 italic" style={{ fontFamily: 'Poppins' }}>
                      No blocked dates
                    </div>
                  )}
                </div>

                {/* Special Pricing Summary - Only show if enabled */}
                {showSpecialPricing && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Poppins' }}>
                    Special Pricing
                  </h3>
                  {pricingRules.length > 0 ? (
                    <div className="space-y-1.5">
                      {pricingRules.map((rule) => (
                        <div 
                          key={rule.id} 
                          className="bg-white border border-gray-200 rounded-lg p-2 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-gray-900 mb-0.5" style={{ fontFamily: 'Poppins' }}>
                                {formatDateDisplay(rule.startDate)} – {formatDateDisplay(rule.endDate)}
                              </div>
                              <div className="text-sm font-semibold text-[#0B5858] mb-0.5" style={{ fontFamily: 'Poppins' }}>
                                {formatCurrency(rule.price)}
                              </div>
                              {rule.note && (
                                <div className="text-[11px] text-gray-600 leading-tight" style={{ fontFamily: 'Poppins' }}>
                                  {rule.note}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => handleRemovePricingRule(rule.id)}
                              className="transition-all duration-200 p-1 flex-shrink-0 cursor-pointer hover:scale-110 active:scale-95 rounded"
                              style={{ 
                                color: '#B84C4C',
                                fontFamily: 'Poppins'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#9A3E3E';
                                e.currentTarget.style.backgroundColor = 'rgba(184, 76, 76, 0.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = '#B84C4C';
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                              aria-label="Remove pricing rule"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 italic" style={{ fontFamily: 'Poppins' }}>
                      No special pricing rules
                    </div>
                  )}
                </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 pb-6 px-6 border-t border-gray-200 flex items-center justify-between" style={{ flexShrink: 0 }}>
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200 cursor-pointer hover:shadow-sm active:scale-95"
            style={{ fontFamily: 'Poppins' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAndClose}
            disabled={isSaving || isLoading}
            className="px-6 py-2 bg-[#0B5858] text-white rounded-lg font-medium hover:bg-[#094b4b] transition-all duration-200 cursor-pointer hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: 'Poppins' }}
          >
            {isSaving ? 'Saving...' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalendarSettingsModal;

