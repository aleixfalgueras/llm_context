import { render, screen } from '@testing-library/react'
import { LandingPage } from '@/components/landing-page'

// Mock next/image to avoid issues in tests
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />
  }
})

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>
  }
})

describe('App Integration', () => {
  it('renders landing page correctly', () => {
    render(<LandingPage />)
    
    // Check main heading
    expect(screen.getByText('AI Chat Assistant')).toBeInTheDocument()
    
    // Check navigation elements
    expect(screen.getByText('Login')).toBeInTheDocument()
    expect(screen.getByText('Get Started')).toBeInTheDocument()
    
    // Check main CTA
    expect(screen.getByText('Start Chatting Now')).toBeInTheDocument()
    
    // Check features section
    expect(screen.getByText('Natural Conversations')).toBeInTheDocument()
    expect(screen.getByText('Lightning Fast')).toBeInTheDocument()
    expect(screen.getByText('Private & Secure')).toBeInTheDocument()
  })

  it('displays app branding correctly', () => {
    render(<LandingPage />)
    
    // Check app name appears
    expect(screen.getByText('AI Chat Assistant')).toBeInTheDocument()
    
    // Check powered by text
    expect(screen.getByText('Powered by OpenAI GPT-4o-mini')).toBeInTheDocument()
  })

  it('shows navigation links', () => {
    render(<LandingPage />)
    
    const loginLink = screen.getByRole('link', { name: /login/i })
    const signUpLink = screen.getByRole('link', { name: /get started/i })
    
    expect(loginLink).toHaveAttribute('href', '/sign-in')
    expect(signUpLink).toHaveAttribute('href', '/sign-up')
  })

  it('displays feature cards with proper content', () => {
    render(<LandingPage />)
    
    // Natural Conversations feature
    expect(screen.getByText('Natural Conversations')).toBeInTheDocument()
    expect(screen.getByText(/flowing, natural conversations/i)).toBeInTheDocument()
    
    // Lightning Fast feature
    expect(screen.getByText('Lightning Fast')).toBeInTheDocument()
    expect(screen.getByText(/instant responses/i)).toBeInTheDocument()
    
    // Private & Secure feature
    expect(screen.getByText('Private & Secure')).toBeInTheDocument()
    expect(screen.getByText(/conversations are private/i)).toBeInTheDocument()
  })

  it('includes stats section', () => {
    render(<LandingPage />)
    
    // Check stats are displayed
    expect(screen.getByText('10K+')).toBeInTheDocument()
    expect(screen.getByText('Active Users')).toBeInTheDocument()
    expect(screen.getByText('1M+')).toBeInTheDocument()
    expect(screen.getByText('Messages Sent')).toBeInTheDocument()
    expect(screen.getByText('99.9%')).toBeInTheDocument()
    expect(screen.getByText('Uptime')).toBeInTheDocument()
  })

  it('has proper footer', () => {
    render(<LandingPage />)
    
    expect(screen.getByText(/© 2024 AI Chat Assistant/i)).toBeInTheDocument()
    // Use getAllByText to handle multiple elements with "Powered by OpenAI"
    const poweredByElements = screen.getAllByText(/Powered by OpenAI/i)
    expect(poweredByElements.length).toBeGreaterThan(0)
  })
}) 