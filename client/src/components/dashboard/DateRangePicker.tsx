import React, { useState, useEffect } from 'react';
import { format, addDays, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  onApply: (range: { from: Date; to: Date }) => void;
  onCancel: () => void;
  initialRange?: { from: Date; to: Date };
}

type TimeRange = 
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'last90days'
  | 'last365days'
  | 'lastMonth'
  | 'last12months'
  | 'lastYear'
  | 'custom';

export default function DateRangePicker({ 
  onApply, 
  onCancel, 
  initialRange 
}: DateRangePickerProps) {
  const today = new Date();
  
  // Initialize with passed range or default to today
  const [dateRange, setDateRange] = useState<{ 
    from: Date; 
    to: Date;
  }>(initialRange || { from: today, to: today });
  
  const [selectedRange, setSelectedRange] = useState<TimeRange>('today');
  const [isOpen, setIsOpen] = useState(false);

  // Calculate date ranges based on selected preset
  useEffect(() => {
    const now = new Date();
    
    switch(selectedRange) {
      case 'today':
        setDateRange({ from: now, to: now });
        break;
      case 'yesterday':
        const yesterday = subDays(now, 1);
        setDateRange({ from: yesterday, to: yesterday });
        break;
      case 'last7days':
        setDateRange({ from: subDays(now, 6), to: now });
        break;
      case 'last30days':
        setDateRange({ from: subDays(now, 29), to: now });
        break;
      case 'last90days':
        setDateRange({ from: subDays(now, 89), to: now });
        break;
      case 'last365days':
        setDateRange({ from: subDays(now, 364), to: now });
        break;
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        setDateRange({ 
          from: startOfMonth(lastMonth), 
          to: endOfMonth(lastMonth) 
        });
        break;
      case 'last12months':
        setDateRange({ from: subMonths(now, 12), to: now });
        break;
      case 'lastYear':
        const lastYear = subYears(now, 1);
        setDateRange({ 
          from: startOfYear(lastYear), 
          to: endOfYear(lastYear) 
        });
        break;
      case 'custom':
        // Don't change dateRange when custom is selected
        break;
    }
  }, [selectedRange]);

  const timeRanges = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'last7days', label: 'Last 7 days' },
    { id: 'last30days', label: 'Last 30 days' },
    { id: 'last90days', label: 'Last 90 days' },
    { id: 'last365days', label: 'Last 365 days' },
    { id: 'lastMonth', label: 'Last month' },
    { id: 'last12months', label: 'Last 12 months' },
    { id: 'lastYear', label: 'Last year' },
  ];

  const handleApply = () => {
    onApply(dateRange);
    setIsOpen(false);
  };

  const handleCalendarSelect = (value: any) => {
    // When a date is selected on the calendar, switch to custom mode
    setSelectedRange('custom');
    
    // Update the date range based on which date was clicked and current selection
    if (!value) return;
    
    if (!dateRange.from) {
      // If no start date, set both to the selected date
      setDateRange({ from: value, to: value });
    } else if (dateRange.from && !dateRange.to) {
      // If start date exists but no end date
      if (value < dateRange.from) {
        // If selected date is before start date, make it the new start date
        setDateRange({ from: value, to: dateRange.from });
      } else {
        // Otherwise set it as end date
        setDateRange({ from: dateRange.from, to: value });
      }
    } else {
      // If both dates exist, start a new selection
      setDateRange({ from: value, to: value });
    }
  };

  // Format date as string for display
  const formatDateString = (date: Date | undefined) => {
    return date ? format(date, 'MMM d, yyyy') : '';
  };

  // Toggle dropdown menu
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Close only if clicking outside and not on the toggle button
      if (isOpen && !target.closest('.date-picker-dropdown') && !target.closest('.date-picker-toggle')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative">
      {/* Toggle button */}
      <Button 
        variant="outline" 
        className="date-picker-toggle flex items-center gap-2 bg-white border-gray-200"
        onClick={toggleDropdown}
      >
        <span className="font-medium">
          {selectedRange === 'custom' 
            ? `${formatDateString(dateRange.from)} - ${formatDateString(dateRange.to)}` 
            : timeRanges.find(range => range.id === selectedRange)?.label || 'Select range'}
        </span>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {/* Dropdown content */}
      {isOpen && (
        <div className="date-picker-dropdown absolute mt-2 z-50 bg-white rounded-lg shadow-xl border border-gray-200 w-[700px]">
          <div className="flex">
            {/* Preset time ranges */}
            <div className="w-56 border-r border-gray-200 py-4 overflow-auto max-h-[450px]">
              {timeRanges.map((range) => (
                <div
                  key={range.id}
                  className={cn(
                    "px-4 py-2 cursor-pointer hover:bg-gray-100",
                    selectedRange === range.id && "bg-gray-100"
                  )}
                  onClick={() => setSelectedRange(range.id as TimeRange)}
                >
                  {selectedRange === range.id && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block mr-2">
                      <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  {range.label}
                </div>
              ))}
            </div>

            {/* Calendar view */}
            <div className="p-4 flex-1">
              <div className="flex justify-between items-center mb-4 gap-2">
                {/* From date input */}
                <input
                  type="text"
                  className="p-2 border border-gray-300 rounded w-full"
                  value={formatDateString(dateRange.from)}
                  readOnly
                />
                <span className="mx-2">→</span>
                {/* To date input */}
                <input
                  type="text"
                  className="p-2 border border-gray-300 rounded w-full"
                  value={formatDateString(dateRange.to)}
                  readOnly
                />
              </div>

              <div className="flex justify-between gap-4">
                {/* Left calendar - Current month */}
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm font-medium">
                      {format(new Date(), 'MMMM yyyy')}
                    </div>
                  </div>
                  <Calendar
                    mode="range"
                    selected={{
                      from: dateRange.from,
                      to: dateRange.to
                    }}
                    onSelect={handleCalendarSelect}
                    className="rounded-md border"
                    numberOfMonths={2}
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end mt-4 gap-2">
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button onClick={handleApply}>
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}