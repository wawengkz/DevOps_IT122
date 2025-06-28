// __tests__/ChatInput.test.js
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

describe('ChatInput Component Tests', () => {
  const axios = require('axios')
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    
    // Mock successful API responses
    axios.get.mockResolvedValue({ data: [] })
    axios.post.mockResolvedValue({
      data: {
        userMessage: { 
          _id: '1', 
          text: 'Test message', 
          isUser: true, 
          createdAt: new Date().toISOString() 
        },
        aiMessage: { 
          _id: '2', 
          text: 'AI response', 
          isUser: false, 
          createdAt: new Date().toISOString() 
        }
      }
    })
  })

  test('submits message when user clicks send', async () => {
    render(<Home />)
    
    // Wait for component to mount and load
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/ask a question/i)).toBeInTheDocument()
    })

    // Find the input and send button
    const input = screen.getByPlaceholderText(/ask a question/i)
    const sendButton = screen.getByRole('button', { name: /send/i })

    // Type a message into the input field
    fireEvent.change(input, { target: { value: 'Test message' } })
    
    // Verify the input has the correct value
    expect(input.value).toBe('Test message')

    // Click the send button
    fireEvent.click(sendButton)

    // Verify the API was called with the correct message
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:3000/api/messages',
        expect.objectContaining({
          text: 'Test message',
          userId: 'anonymous'
        })
      )
    })

    // Verify the input field is cleared after submission
    await waitFor(() => {
      expect(input.value).toBe('')
    })
  })

  test('does not submit empty messages', async () => {
    render(<Home />)
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/ask a question/i)).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText(/ask a question/i)
    const sendButton = screen.getByRole('button', { name: /send/i })

    // Click send button without typing anything
    fireEvent.click(sendButton)

    // Verify that no API call was made
    expect(axios.post).not.toHaveBeenCalled()
    
    // Verify input is still empty
    expect(input.value).toBe('')
  })
})