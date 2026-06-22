import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../src/App';

describe('App Component Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should render the login card by default', () => {
    render(<App />);
    
    const logoHeaders = screen.getAllByText(/Interview/i);
    expect(logoHeaders.length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText('you@domain.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument();
  });

  it('should switch to registration view when clicking register link', () => {
    render(<App />);
    
    const registerLink = screen.getByText('Register here');
    fireEvent.click(registerLink);
    
    expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Register Account' })).toBeInTheDocument();
  });

  it('should render dashboard layout if token is in localStorage', async () => {
    localStorage.setItem('token', 'fake-token-123');
    
    const mockUser = { id: 1, name: 'Stephen Giang', email: 'sgiang@example.com' };
    
    globalThis.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUser),
        } as Response);
      }
      if (url.includes('/history')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response);
      }
      return Promise.resolve({ ok: false } as Response);
    });

    render(<App />);

    // Renders header title
    const headerTitle = await screen.findByText('Interviewer AI');
    expect(headerTitle).toBeInTheDocument();

    // Renders the default welcome placeholder
    expect(screen.getByText('CONSOLE IDLE • UNMUTE MIC TO CHAT')).toBeInTheDocument();
  });

  it('should open navigation menu when clicking hamburger button', async () => {
    localStorage.setItem('token', 'fake-token-123');
    
    const mockUser = { id: 1, name: 'Stephen Giang', email: 'sgiang@example.com' };
    
    globalThis.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUser),
        } as Response);
      }
      if (url.includes('/history')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response);
      }
      return Promise.resolve({ ok: false } as Response);
    });

    render(<App />);

    // Wait for dashboard to load
    await screen.findByText('Interviewer AI');

    // Find hamburger menu button and click
    const menuBtn = screen.getByTitle('Open menu');
    fireEvent.click(menuBtn);

    // Verify nav menu items are displayed
    expect(screen.getByText('Current Convo')).toBeInTheDocument();
    expect(screen.getByText('Past Convos')).toBeInTheDocument();
    expect(screen.getByText('Themes')).toBeInTheDocument();
    expect(screen.getByText('User Settings')).toBeInTheDocument();
    
    // Toggler should now have close title
    expect(screen.getByTitle('Close menu')).toBeInTheDocument();
  });
});
