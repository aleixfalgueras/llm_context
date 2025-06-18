import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { ThemeProvider } from '@/components/theme-provider'

// Mock Clerk provider for testing
const MockClerkProvider = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="mock-clerk-provider">{children}</div>
}

// Test wrapper with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <MockClerkProvider>
      <ThemeProvider attribute="class" defaultTheme="light">
        {children}
      </ThemeProvider>
    </MockClerkProvider>
  )
}

// Custom render function with providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Mock data factories
export const createMockClient = (overrides = {}) => ({
  id: 'test-client-id',
  userId: 'test-user-id', 
  name: 'Test Client',
  email: 'test@example.com',
  phone: '+1234567890',
  dateOfBirth: new Date('1990-01-01'),
  height: 180,
  weight: 75,
  country: 'USA',
  goals: 'Test goals',
  medicalHistory: 'None',
  notes: 'Test notes',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createMockChat = (overrides = {}) => ({
  id: 'test-chat-id',
  title: 'Test Chat',
  userId: 'test-user-id',
  clientId: 'test-client-id',
  createdAt: new Date(),
  updatedAt: new Date(),
  messages: [],
  ...overrides,
})

export const createMockMessage = (overrides = {}) => ({
  id: 'test-message-id',
  chatId: 'test-chat-id',
  role: 'USER' as const,
  content: 'Test message',
  createdAt: new Date(),
  ...overrides,
}) 