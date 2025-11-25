import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import Header from '@/components/header/Header'

const useAuthMock = jest.fn()

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

jest.mock('next/navigation', () => ({
  usePathname: () => '/feed',
}))

jest.mock('@/components/header/Logo', () => {
  const LogoMock: React.FC = () => <div data-testid="logo">Logo</div>
  LogoMock.displayName = 'LogoMock'
  return LogoMock
})

jest.mock('@/features/notifications/components/NotificationIcon', () => {
  const NotificationIconMock: React.FC = () => (
    <div data-testid="notification-icon">Notifications</div>
  )
  NotificationIconMock.displayName = 'NotificationIconMock'
  return NotificationIconMock
})

jest.mock('@/components/header/SearchBar', () => {
  const SearchBarMock: React.FC<{
    isOpen: boolean
    onToggle: () => void
  }> = (props) => (
    <button data-testid="search-bar" data-open={String(props.isOpen)} onClick={props.onToggle}>
      SearchStub
    </button>
  )
  SearchBarMock.displayName = 'SearchBarMock'
  return SearchBarMock
})

jest.mock('@/components/header/Navigation', () => {
  const NavigationMock: React.FC<{ pathname: string }> = (props) => (
    <div data-testid="navigation">Nav for {props.pathname}</div>
  )
  NavigationMock.displayName = 'NavigationMock'
  return NavigationMock
})

jest.mock('@/components/header/TimerStatus', () => {
  const TimerStatusMock: React.FC<{ pathname: string }> = (props) => (
    <div data-testid="timer-status">Timer {props.pathname}</div>
  )
  TimerStatusMock.displayName = 'TimerStatusMock'
  return TimerStatusMock
})

jest.mock('@/components/header/ProfileMenu', () => {
  const ProfileMenuMock: React.FC<{ user: { id: string } }> = (props) => (
    <div data-testid="profile-menu">Profile {props.user.id}</div>
  )
  ProfileMenuMock.displayName = 'ProfileMenuMock'
  return ProfileMenuMock
})

jest.mock('@/components/header/MobileMenu', () => {
  const MobileMenuMock: React.FC<{
    isOpen: boolean
    onToggle: () => void
    pathname: string
  }> = (props) => (
    <button data-testid="mobile-menu" data-open={String(props.isOpen)} onClick={props.onToggle}>
      MobileMenu {props.pathname}
    </button>
  )
  MobileMenuMock.displayName = 'MobileMenuMock'
  return MobileMenuMock
})

jest.mock('@/components/header/AuthButtons', () => {
  const AuthButtonsMock: React.FC = () => <div data-testid="auth-buttons">Auth Buttons</div>
  AuthButtonsMock.displayName = 'AuthButtonsMock'
  return AuthButtonsMock
})

describe('components/header/Header', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
  })

  it('renders guest navigation when no user is present', () => {
    useAuthMock.mockReturnValue({ user: null })

    render(<Header />)

    expect(screen.getByTestId('logo')).toBeInTheDocument()
    expect(screen.getByTestId('auth-buttons')).toBeInTheDocument()
    expect(screen.queryByTestId('search-bar')).not.toBeInTheDocument()
    expect(screen.queryByTestId('navigation')).not.toBeInTheDocument()
    expect(screen.queryByTestId('timer-status')).not.toBeInTheDocument()
    expect(screen.queryByTestId('profile-menu')).not.toBeInTheDocument()
    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument()
    expect(screen.queryByTestId('notification-icon')).not.toBeInTheDocument()
  })

  it('renders authenticated view and toggles menus correctly', () => {
    useAuthMock.mockReturnValue({ user: { id: 'user-1' } })

    render(<Header />)

    expect(screen.getByTestId('search-bar')).toHaveAttribute('data-open', 'false')
    expect(screen.getByTestId('navigation')).toHaveTextContent('/feed')
    expect(screen.getByTestId('timer-status')).toBeInTheDocument()
    expect(screen.getByTestId('profile-menu')).toHaveTextContent('user-1')
    expect(screen.getByTestId('mobile-menu')).toHaveAttribute('data-open', 'false')
    expect(screen.getByTestId('notification-icon')).toBeInTheDocument()

    // Toggle search bar open -> navigation should hide
    fireEvent.click(screen.getByTestId('search-bar'))
    expect(screen.getByTestId('search-bar')).toHaveAttribute('data-open', 'true')
    expect(screen.queryByTestId('navigation')).not.toBeInTheDocument()

    // Toggle mobile menu
    fireEvent.click(screen.getByTestId('mobile-menu'))
    expect(screen.getByTestId('mobile-menu')).toHaveAttribute('data-open', 'true')
  })
})
