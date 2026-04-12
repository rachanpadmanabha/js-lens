import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ExplainerDrawer from '../Intel/ExplainerDrawer';

const mockConcept = {
  name: 'Closure',
  icon: '🔒',
  color: 'blue',
  description: 'A closure remembers variables from its outer scope.',
  detail: 'Inner function closes over outer variables.',
};

describe('ExplainerDrawer', () => {
  it('renders nothing when concept is null', () => {
    const { container } = render(<ExplainerDrawer concept={null} onClose={() => {}} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders concept name', () => {
    render(<ExplainerDrawer concept={mockConcept} onClose={() => {}} />);
    expect(screen.getByText('Closure')).toBeInTheDocument();
  });

  it('renders concept icon', () => {
    render(<ExplainerDrawer concept={mockConcept} onClose={() => {}} />);
    expect(screen.getByText('🔒')).toBeInTheDocument();
  });

  it('renders concept description', () => {
    render(<ExplainerDrawer concept={mockConcept} onClose={() => {}} />);
    expect(screen.getByText(mockConcept.description)).toBeInTheDocument();
  });

  it('renders concept detail', () => {
    render(<ExplainerDrawer concept={mockConcept} onClose={() => {}} />);
    expect(screen.getByText(mockConcept.detail)).toBeInTheDocument();
  });

  it('renders diagram for Closure', () => {
    const { container } = render(
      <ExplainerDrawer concept={mockConcept} onClose={() => {}} />
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<ExplainerDrawer concept={mockConcept} onClose={onClose} />);
    const closeBtn = screen.getByRole('button');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('renders Promise / Async concept correctly', () => {
    const promiseConcept = {
      name: 'Promise / Async',
      icon: '⏳',
      color: 'purple',
      description: 'Promises represent async operations.',
      detail: 'Microtasks run before macrotasks.',
    };
    render(<ExplainerDrawer concept={promiseConcept} onClose={() => {}} />);
    expect(screen.getByText('Promise / Async')).toBeInTheDocument();
    expect(screen.getByText('⏳')).toBeInTheDocument();
  });

  it('renders concept without diagram gracefully', () => {
    const noDiagramConcept = {
      name: 'Recursion',
      icon: '🌀',
      color: 'pink',
      description: 'Function calls itself.',
      detail: 'Need a base case.',
    };
    render(<ExplainerDrawer concept={noDiagramConcept} onClose={() => {}} />);
    expect(screen.getByText('Recursion')).toBeInTheDocument();
  });
});
