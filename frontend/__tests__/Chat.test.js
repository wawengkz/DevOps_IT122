// __tests__/Chat.test.js
// Test Loading and Error States - Tests the Chat component's behavior for showing a loading indicator during an API call and displaying an error message if the API call fails

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Home from '../pages/index'

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
}))

// Mock window properties
Object.defineProperty(window, 'addEventListener', {
  value: jest.fn(),
  writable: true
})

Object.defineProperty(window, 'removeEventListener', {
  value: jest.fn(),
  writable: true
})

Object.defineProperty(window, 'innerWidth', {
  value: 1024,
  writable: true
})

Object.defineProperty(window, 'innerHeight', {
  value: 768,
  writable: true
})

describe('Test Loading and Error States', () => {
  const axios = require('axios')
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    
    // Mock successful initial API responses by default
    axios.get.mockResolvedValue({ data: [] })
  })

  test('shows loading indicator while waiting for response', async () => {
    // Mock fetch to delay response
    axios.post.mockImplementationOnce(() => new Promise(resolve => {
      setTimeout(() => resolve({
        data: {
          userMessage: { _id: '1', text: 'Hello', isUser: true, createdAt: new Date().toISOString() },
          aiMessage: { _id: '2', text: 'Hi there!', isUser: false, createdAt: new Date().toISOString() }
        }
      }), 100);
    }));

    render(<Home />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/ask a question/i)).toBeInTheDocument();
    });

    // Type and submit a message
    const input = screen.getByPlaceholderText(/ask a question/i);
    const button = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(button);

    // Check for loading indicator
    expect(screen.getByText(/ai tutor is typing/i)).toBeInTheDocument();
    
    // Wait for response
    await waitFor(() => {
      expect(screen.queryByText(/ai tutor is typing/i)).not.toBeInTheDocument();
    });
  });

  test('shows error message when API call fails', async () => {
    // Mock fetch to reject with an error
    axios.post.mockRejectedValueOnce(new Error('Network error'));

    render(<Home />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/ask a question/i)).toBeInTheDocument();
    });

    // Type and submit a message
    const input = screen.getByPlaceholderText(/ask a question/i);
    const button = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(button);

    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/sorry, i couldn't process your request/i)).toBeInTheDocument();
    });
  });
});