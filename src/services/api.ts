import axios from 'axios'
import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { createLogger, serializeError } from './logger'

interface RefreshResponse {
  success: boolean
  data: {
    access_token: string
  }
}

const logger = createLogger('api')

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://dev.api.igrastudios.com/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

let isRefreshing = false
let failedQueue: any[] = []

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })

  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const requestUrl = originalRequest?.url ?? 'unknown'

    if (error.response?.status === 401 && !originalRequest._retry) {
      logger.warn('api.unauthorized_response', {
        url: requestUrl,
        method: originalRequest?.method,
      })

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${token}`
            }
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.get<RefreshResponse>(
          `${import.meta.env.VITE_API_BASE_URL || 'https://dev.api.igrastudios.com/api/v1'}/auth/refresh`,
          { withCredentials: true }
        )

        const { access_token } = data.data
        isRefreshing = false
        processQueue(null, access_token)

        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${access_token}`
        }

        logger.info('auth.refresh_succeeded', {
          url: requestUrl,
        })

        return api(originalRequest)
      } catch (refreshError) {
        isRefreshing = false
        processQueue(refreshError as AxiosError, null)

        logger.error('auth.refresh_failed', {
          url: requestUrl,
          error: serializeError(refreshError),
        })

        window.dispatchEvent(new Event('auth:logout'))

        return Promise.reject(refreshError)
      }
    }

    logger.error('api.request_failed', {
      url: requestUrl,
      method: originalRequest?.method,
      statusCode: error.response?.status,
      error: serializeError(error),
    })

    return Promise.reject(error)
  }
)

export default api
