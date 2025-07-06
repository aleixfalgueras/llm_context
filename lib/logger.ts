interface LogContext {
  userId?: string;
  clientId?: string;
  chatId?: string;
  operation?: string;
  duration?: number;
  tokensUsed?: number;
  model?: string;
  metadata?: Record<string, any>;
}

interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  message: string;
  context?: LogContext;
  stack?: string;
}

// Environment detection for color support
const isProduction = (): boolean => {
  return process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
};

// ANSI color codes for terminal (disabled in production to prevent garbled output)
const getColors = () => {
  if (isProduction()) {
    // Return empty strings for production to avoid ANSI codes in logs
    return {
      reset: '',
      bright: '',
      dim: '',
      black: '',
      red: '',
      green: '',
      yellow: '',
      blue: '',
      magenta: '',
      cyan: '',
      white: '',
      gray: '',
      bgRed: '',
      bgGreen: '',
      bgYellow: '',
      bgBlue: '',
      bgMagenta: '',
      bgCyan: '',
    } as const;
  }
  
  // Return ANSI codes for local development
  return {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    
    // Text colors
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
    
    // Background colors
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
    bgMagenta: '\x1b[45m',
    bgCyan: '\x1b[46m',
  } as const;
};

const colors = getColors();

class Logger {
  private formatTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  private createLogEntry(
    level: LogEntry['level'],
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    return {
      timestamp: this.formatTimestamp(),
      level,
      message,
      context,
      ...(error && { stack: error.stack })
    };
  }

  private getLogColors(level: LogEntry['level']): { levelColor: string; messageColor: string; timestampColor: string } {
    switch (level) {
      case 'DEBUG':
        return { 
          levelColor: colors.gray, 
          messageColor: colors.gray, 
          timestampColor: colors.dim + colors.gray 
        };
      case 'INFO':
        return { 
          levelColor: colors.blue, 
          messageColor: colors.reset, 
          timestampColor: colors.dim + colors.cyan 
        };
      case 'WARN':
        return { 
          levelColor: colors.yellow, 
          messageColor: colors.yellow, 
          timestampColor: colors.dim + colors.yellow 
        };
      case 'ERROR':
        return { 
          levelColor: colors.bgRed + colors.white, 
          messageColor: colors.red, 
          timestampColor: colors.dim + colors.red 
        };
      default:
        return { 
          levelColor: colors.reset, 
          messageColor: colors.reset, 
          timestampColor: colors.reset 
        };
    }
  }

  private formatLogOutput(entry: LogEntry): string {
    const { levelColor, messageColor, timestampColor } = this.getLogColors(entry.level);
    
    // Format context safely without color contamination
    const contextStr = entry.context 
      ? ` | Context: ${JSON.stringify(entry.context)}`
      : '';
    
    const timestamp = `${timestampColor}[${entry.timestamp}]${colors.reset}`;
    const level = `${levelColor}${entry.level.padEnd(5)}${colors.reset}`;
    const message = `${messageColor}${entry.message}${colors.reset}`;
    
    return `${timestamp} ${level}: ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    const entry = this.createLogEntry('DEBUG', message, context);
    console.debug(this.formatLogOutput(entry));
  }

  info(message: string, context?: LogContext): void {
    const entry = this.createLogEntry('INFO', message, context);
    console.info(this.formatLogOutput(entry));
  }

  warn(message: string, context?: LogContext): void {
    const entry = this.createLogEntry('WARN', message, context);
    console.warn(this.formatLogOutput(entry));
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const entry = this.createLogEntry('ERROR', message, context, error);
    console.error(this.formatLogOutput(entry));
    if (error?.stack) {
      console.error(`${colors.dim}${colors.red}Stack trace: ${error.stack}${colors.reset}`);
    }
  }

  // Performance timing helpers - only log when operations take too long
  startTiming(operation: string, context?: LogContext, threshold: number = 1000): () => void {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      
      // Only log if operation exceeds threshold (default 1000ms)
      if (duration >= threshold) {
        const durationStr = duration < 500 ? 
          `${colors.yellow}${duration}ms${colors.reset}` : 
          `${colors.red}${duration}ms${colors.reset}`;
        
        this.warn(`🐌 Slow Operation: ${operation} took ${durationStr}`, { ...context, duration });
      }
    };
  }

  // API-specific logging
  apiRequest(method: string, path: string, context?: LogContext): void {
    const methodColor = method === 'GET' ? colors.blue : 
                       method === 'POST' ? colors.green : 
                       method === 'PUT' ? colors.yellow : 
                       method === 'DELETE' ? colors.red : colors.reset;
    
    this.info(`🌐 API Request: ${methodColor}${method}${colors.reset} ${colors.cyan}${path}${colors.reset}`, context);
  }

  apiResponse(method: string, path: string, status: number, context?: LogContext): void {
    const statusColor = status < 300 ? colors.green : 
                       status < 400 ? colors.yellow : colors.red;
    const methodColor = method === 'GET' ? colors.blue : 
                       method === 'POST' ? colors.green : 
                       method === 'PUT' ? colors.yellow : 
                       method === 'DELETE' ? colors.red : colors.reset;
    
    const statusIcon = status < 300 ? '✅' : status < 400 ? '⚠️' : '❌';
    
    this.info(`${statusIcon} API Response: ${methodColor}${method}${colors.reset} ${colors.cyan}${path}${colors.reset} - ${statusColor}${status}${colors.reset}`, context);
  }

  // Database operation logging
  dbQuery(operation: string, table: string, context?: LogContext): void {
    const operationColor = operation.toLowerCase().includes('create') ? colors.green :
                          operation.toLowerCase().includes('update') ? colors.yellow :
                          operation.toLowerCase().includes('delete') ? colors.red :
                          operation.toLowerCase().includes('find') ? colors.blue : colors.reset;
    
    this.debug(`🗃️  DB Query: ${operationColor}${operation}${colors.reset} on ${colors.magenta}${table}${colors.reset}`, context);
  }

  dbError(operation: string, table: string, error: Error, context?: LogContext): void {
    this.error(`💥 DB Error: ${colors.red}${operation}${colors.reset} on ${colors.magenta}${table}${colors.reset}`, error, context);
  }

  // User action logging
  userAction(action: string, context?: LogContext): void {
    this.info(`👤 User Action: ${colors.bright}${action}${colors.reset}`, context);
  }

  // AI service logging
  aiRequest(model: string, tokensUsed?: number, context?: LogContext): void {
    const tokensStr = tokensUsed ? ` (${colors.cyan}${tokensUsed} tokens${colors.reset})` : '';
    this.info(`🤖 AI Request: ${colors.magenta}${model}${colors.reset}${tokensStr}`, { ...context, tokensUsed });
  }

  aiError(model: string, error: Error, context?: LogContext): void {
    this.error(`🤖💥 AI Error: ${colors.magenta}${model}${colors.reset}`, error, context);
  }
}

export const logger = new Logger();

// Convenience function for performance measurement
export function withTiming<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: LogContext,
  threshold?: number
): Promise<T> {
  const endTiming = logger.startTiming(operation, context, threshold);
  return fn().finally(endTiming);
}

// Function to create context from request
export function createRequestContext(req: Request, userId?: string): LogContext {
  const url = new URL(req.url);
  return {
    userId,
    operation: `${req.method} ${url.pathname}`,
    // Removed verbose metadata (userAgent, origin) to keep logs clean
  };
} 