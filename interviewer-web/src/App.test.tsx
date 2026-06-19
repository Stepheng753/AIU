import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('App Component Unit Tests', () => {
  it('should render the login card by default', () => {
    render(<App />);
    
    // Check main title
    const logoHeaders = screen.getAllByText('Interview.ai');
    expect(logoHeaders.length).toBeGreaterThan(0);
    
    // Check inputs and button
    expect(screen.getByPlaceholderText('you@domain.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument();
  });

  it('should switch to registration view when clicking register link', () => {
    render(<App />);
    
    // Click register
    const registerLink = screen.getByText('Register here');
    fireEvent.click(registerLink);
    
    // Check registration page elements
    expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Register Account' })).toBeInTheDocument();
  });
});
