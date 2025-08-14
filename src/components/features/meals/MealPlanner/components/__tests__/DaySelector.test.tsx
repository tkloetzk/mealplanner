import { render, screen, fireEvent } from '@testing-library/react';
import { DaySelector } from '../DaySelector';
import type { DayType } from '@/types/shared';

// Mock dateUtils
jest.mock('@/utils/dateUtils', () => ({
  getOrderedDays: () => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
}));

describe('DaySelector', () => {
  const mockOnDaySelect = jest.fn();
  const defaultProps = {
    selectedDay: 'monday' as DayType,
    onDaySelect: mockOnDaySelect
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all days of the week', () => {
    render(<DaySelector {...defaultProps} />);
    
    expect(screen.getByText('monday')).toBeInTheDocument();
    expect(screen.getByText('tuesday')).toBeInTheDocument();
    expect(screen.getByText('wednesday')).toBeInTheDocument();
    expect(screen.getByText('thursday')).toBeInTheDocument();
    expect(screen.getByText('friday')).toBeInTheDocument();
    expect(screen.getByText('saturday')).toBeInTheDocument();
    expect(screen.getByText('sunday')).toBeInTheDocument();
  });

  it('highlights the selected day', () => {
    render(<DaySelector {...defaultProps} selectedDay="wednesday" />);
    
    const mondayButton = screen.getByText('monday');
    const wednesdayButton = screen.getByText('wednesday');
    
    expect(mondayButton).toHaveClass('bg-gray-100');
    expect(wednesdayButton).toHaveClass('bg-blue-500', 'text-white');
  });

  it('calls onDaySelect when a day is clicked', () => {
    render(<DaySelector {...defaultProps} />);
    
    const tuesdayButton = screen.getByText('tuesday');
    fireEvent.click(tuesdayButton);
    
    expect(mockOnDaySelect).toHaveBeenCalledWith('tuesday');
  });

  it('does not re-render when props have not changed', () => {
    const { rerender } = render(<DaySelector {...defaultProps} />);
    
    // Re-render with same props
    rerender(<DaySelector {...defaultProps} />);
    
    // Should still have the same selected day
    expect(screen.getByText('monday')).toHaveClass('bg-blue-500', 'text-white');
  });

  it('updates selection when selectedDay prop changes', () => {
    const { rerender } = render(<DaySelector {...defaultProps} />);
    
    expect(screen.getByText('monday')).toHaveClass('bg-blue-500', 'text-white');
    expect(screen.getByText('friday')).toHaveClass('bg-gray-100');
    
    rerender(<DaySelector {...defaultProps} selectedDay="friday" />);
    
    expect(screen.getByText('monday')).toHaveClass('bg-gray-100');
    expect(screen.getByText('friday')).toHaveClass('bg-blue-500', 'text-white');
  });

  it('has accessible button roles', () => {
    render(<DaySelector {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(7);
    
    buttons.forEach(button => {
      expect(button).toBeVisible();
    });
  });

  it('handles scroll for responsive design', () => {
    render(<DaySelector {...defaultProps} />);
    
    const container = screen.getByText('monday').parentElement;
    expect(container).toHaveClass('overflow-x-auto');
  });
});