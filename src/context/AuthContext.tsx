import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react'
import type { User } from '../services/authService'
import authService from '../services/authService'
import api from '../services/api'
import { createLogger, serializeError } from '../services/logger'

interface AuthContextType {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: any) => Promise<void>
  register: (userData: any) => Promise<void>
  logout: () => Promise<void>
  updateUser: (updatedUser: User) => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

const logger = createLogger('AuthContext')

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch (err) {
      logger.error('auth.logout_failed', {
        error: serializeError(err),
      })
    } finally {
      setUser(null)
      setAccessToken(null)
      delete api.defaults.headers.common['Authorization']
    }
  }, [])

  const login = async (credentials: any) => {
    const response = await authService.login(credentials)
    const { user: userData, access_token } = response.data
    updateUser(userData)
    setAccessToken(access_token)
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
  }

  const register = async (userData: any) => {
    const response = await authService.register(userData)
    const { user: newUser, access_token } = response.data
    updateUser(newUser)
    setAccessToken(access_token)
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
  }

  const updateUser = useCallback((updatedUser: User) => {
    // Ensure name is populated for legacy/convenience
    const userWithName = {
      ...updatedUser,
      name: updatedUser.name || `${updatedUser.firstName} ${updatedUser.lastName}`.trim() || updatedUser.email
    }
    setUser(userWithName)
  }, [])

  // Silent Refresh on Mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Step 1: Refresh token (reads HttpOnly cookie)
        const refreshResponse = await authService.refreshToken()
        const newAccessToken = refreshResponse.data.access_token

        // Step 2: Set token in Axios
        setAccessToken(newAccessToken)
        api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`

        // Step 3: Fetch profile using the new access token
        const profileResponse = await authService.getProfile()
        updateUser(profileResponse.data.user)
      } catch (err) {
        logger.warn('auth.initial_refresh_failed', {
          error: serializeError(err),
        })
        // Clear everything to be safe
        setUser(null)
        setAccessToken(null)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [updateUser])

  // Listen for global logout events from interceptor
  useEffect(() => {
    const handleLogout = () => {
      setUser(null)
      setAccessToken(null)
      delete api.defaults.headers.common['Authorization']
    }

    window.addEventListener('auth:logout', handleLogout)
    return () => window.removeEventListener('auth:logout', handleLogout)
  }, [])

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      updateUser,
    }),
    [user, accessToken, isLoading, logout, updateUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
