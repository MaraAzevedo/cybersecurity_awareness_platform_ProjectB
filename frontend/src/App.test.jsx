import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the login screen by default', () => {
    render(<App />)

    expect(screen.getByText(/Sign in to your account/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument()
  })
})
