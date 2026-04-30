type LogLevel = 'debug' | 'info' | 'warn' | 'error'

type LogContext = Record<string, unknown>

interface BrowserLogEntry {
  timestamp: string
  level: LogLevel
  service: 'igra-web'
  environment: string
  message: string
  context?: LogContext
}

const environment = import.meta.env.MODE || 'development'
const enabledLevels: Record<string, LogLevel[]> = {
  development: ['debug', 'info', 'warn', 'error'],
  production: ['info', 'warn', 'error'],
  test: ['warn', 'error'],
}

export function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }

  return {
    message: typeof error === 'string' ? error : 'Unknown error',
    value: error,
  }
}

function write(level: LogLevel, message: string, context?: LogContext) {
  if (!enabledLevels[environment]?.includes(level)) {
    return
  }

  if (environment === 'development') {
    const timestamp = new Date().toLocaleTimeString([], { hour12: false })
    const icons = { debug: '🐞', info: 'ℹ️', warn: '⚠️', error: '🚨' }
    const colors = { debug: '#7f8c8d', info: '#3498db', warn: '#f39c12', error: '#e74c3c' }
    
    const scope = (context?.scope as string) || 'global'
    const cleanContext = { ...context }
    delete cleanContext.scope

    console.groupCollapsed(
      `%c${icons[level]} ${timestamp} %c${level.toUpperCase()}%c [${scope}] %c${message}`,
      'color: #95a5a6; font-weight: normal;',
      `color: ${colors[level]}; font-weight: bold;`,
      'color: #9b59b6; font-weight: bold;',
      'color: #ecf0f1; font-weight: normal;'
    )
    if (Object.keys(cleanContext).length > 0) {
      console.log('Context:', cleanContext)
    }
    console.groupEnd()
    return
  }

  const entry: BrowserLogEntry = {
    timestamp: new Date().toISOString(),
    level,
    service: 'igra-web',
    environment,
    message,
    ...(context ? { context } : {}),
  }

  const payload = JSON.stringify(entry)

  switch (level) {
    case 'debug': console.debug(payload); break
    case 'info': console.info(payload); break
    case 'warn': console.warn(payload); break
    case 'error': console.error(payload); break
  }
}

export function createLogger(scope: string) {
  const withScope = (context?: LogContext) => ({
    scope,
    ...context,
  })

  return {
    debug(message: string, context?: LogContext) {
      write('debug', message, withScope(context))
    },
    info(message: string, context?: LogContext) {
      write('info', message, withScope(context))
    },
    warn(message: string, context?: LogContext) {
      write('warn', message, withScope(context))
    },
    error(message: string, context?: LogContext) {
      write('error', message, withScope(context))
    },
  }
}
