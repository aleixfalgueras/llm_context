'use client'

interface ClientLogContext {
  userId?: string;
  chatId?: string;
  clientId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

interface ClientLogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  message: string;
  context?: ClientLogContext;
  userAgent?: string;
  url?: string;
}

// ANSI color codes for browser console
const clientColors = {
  reset: '',
  
  // CSS styles for console.log styling
  debug: 'color: #888; font-weight: normal;',
  info: 'color: #0066cc; font-weight: normal;',
  warn: 'color: #ff9900; font-weight: bold;',
  error: 'color: #cc0000; font-weight: bold; background: #ffe6e6; padding: 2px 4px;',
  
  timestamp: 'color: #666; font-size: 11px;',
  context: 'color: #006666; font-style: italic;',
  component: 'color: #9900cc; font-weight: bold;',
  success: 'color: #00aa00; font-weight: bold;',
  performance: 'color: #ff6600; font-weight: bold;',
} as const;



class ClientLogger {
  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private createLogEntry(
    level: ClientLogEntry['level'],
    message: string,
    context?: ClientLogContext,
    error?: Error
  ): ClientLogEntry {
    return {
      timestamp: this.formatTimestamp(),
      level,
      message,
      context,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };
  }

  private formatLogOutput(entry: ClientLogEntry): { message: string; styles: string[] } {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const level = entry.level;
    
    // Determine emoji and color based on context or level
    let emoji = '📋';
    let operation = '';
    
    if (entry.context?.component) {
      emoji = '🎯';
      operation = ` [${entry.context.component}]`;
    } else if (entry.message.includes('API')) {
      emoji = '🌐';
    } else if (entry.message.includes('User Interaction')) {
      emoji = '👤';
    } else if (entry.message.includes('Navigation')) {
      emoji = '🧭';
    } else if (entry.message.includes('Message')) {
      emoji = '💬';
    } else if (entry.message.includes('Export')) {
      emoji = '📤';
    } else if (entry.message.includes('Component')) {
      emoji = '⚛️';
    }

    const contextStr = entry.context 
      ? ` | ${JSON.stringify(entry.context)}`
      : '';

    const message = `${emoji} %c[CLIENT] %c${timestamp} %c${level}:%c ${entry.message}${operation}%c${contextStr}`;
    
    // Define styles for each %c placeholder
    const styles = [
      clientColors.component, // [CLIENT]
      clientColors.timestamp, // timestamp
      this.getLevelStyle(level), // level
      'color: #333; font-weight: normal;', // message
      clientColors.context // context
    ];

    return { message, styles };
  }

  private getLevelStyle(level: string): string {
    switch (level) {
      case 'DEBUG': return clientColors.debug;
      case 'INFO': return clientColors.info;
      case 'WARN': return clientColors.warn;
      case 'ERROR': return clientColors.error;
      default: return clientColors.info;
    }
  }

  debug(message: string, context?: ClientLogContext): void {
    if (typeof window !== 'undefined') {
      const entry = this.createLogEntry('DEBUG', message, context);
      const { message: formattedMessage, styles } = this.formatLogOutput(entry);
      console.debug(formattedMessage, ...styles);
    }
  }

  info(message: string, context?: ClientLogContext): void {
    if (typeof window !== 'undefined') {
      const entry = this.createLogEntry('INFO', message, context);
      const { message: formattedMessage, styles } = this.formatLogOutput(entry);
      console.info(formattedMessage, ...styles);
    }
  }

  warn(message: string, context?: ClientLogContext): void {
    if (typeof window !== 'undefined') {
      const entry = this.createLogEntry('WARN', message, context);
      const { message: formattedMessage, styles } = this.formatLogOutput(entry);
      console.warn(formattedMessage, ...styles);
    }
  }

  error(message: string, error?: Error, context?: ClientLogContext): void {
    if (typeof window !== 'undefined') {
      const entry = this.createLogEntry('ERROR', message, context, error);
      const { message: formattedMessage, styles } = this.formatLogOutput(entry);
      console.error(formattedMessage, ...styles);
      if (error?.stack) {
        console.error('🔍 Client Stack trace:', error.stack);
      }
    }
  }

  // Performance timing helpers for client-side - only log when operations take too long
  startTiming(operation: string, context?: ClientLogContext, threshold: number = 1000): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = Math.round(performance.now() - startTime);
      
      // Only log if operation exceeds threshold (default 1000ms)
      if (duration >= threshold) {
        const durationIcon = duration < 500 ? '⏱️' : '🐌';
        this.warn(`${durationIcon} Slow Client Operation: ${operation} (${duration}ms)`, { 
          ...context, 
          metadata: { ...context?.metadata, duration } 
        });
      }
    };
  }

  // User interaction logging
  userInteraction(action: string, context?: ClientLogContext): void {
    this.info(`👤 User Interaction: ${action}`, context);
  }

  // API call logging from client
  apiCall(method: string, path: string, context?: ClientLogContext): void {
    this.info(`🌐 Client API Call: ${method} ${path}`, context);
  }

  apiResponse(method: string, path: string, status: number, context?: ClientLogContext): void {
    const statusIcon = status >= 400 ? '❌' : status >= 300 ? '🔄' : '✅';
    if (status >= 400) {
      this.error(`${statusIcon} Client API Response: ${method} ${path} - ${status}`, undefined, context);
    } else if (status >= 300) {
      this.warn(`${statusIcon} Client API Response: ${method} ${path} - ${status}`, context);
    } else {
      this.info(`${statusIcon} Client API Response: ${method} ${path} - ${status}`, context);
    }
  }

  // Component lifecycle logging
  componentMount(componentName: string, context?: ClientLogContext): void {
    this.debug(`⚛️ Component Mounted: ${componentName}`, { ...context, component: componentName });
  }

  componentUnmount(componentName: string, context?: ClientLogContext): void {
    this.debug(`⚛️ Component Unmounted: ${componentName}`, { ...context, component: componentName });
  }

  // Navigation logging
  navigationEvent(from: string, to: string, context?: ClientLogContext): void {
    this.info(`🧭 Navigation: ${from} → ${to}`, context);
  }

  // Chat-specific logging
  messageInput(length: number, context?: ClientLogContext): void {
    this.debug(`✏️ Message input (${length} chars)`, { ...context, metadata: { ...context?.metadata, messageLength: length } });
  }

  messageSent(length: number, model?: string, context?: ClientLogContext): void {
    this.info(`📤 Message sent (${length} chars)${model ? ` via ${model}` : ''}`, { 
      ...context, 
      metadata: { ...context?.metadata, messageLength: length, model } 
    });
  }

  messageReceived(length: number, context?: ClientLogContext): void {
    this.info(`📥 Message received (${length} chars)`, { 
      ...context, 
      metadata: { ...context?.metadata, responseLength: length } 
    });
  }

  promptSelected(promptName: string, context?: ClientLogContext): void {
    this.info(`🎯 Prompt selected: ${promptName}`, context);
  }

  exportInitiated(type: string, context?: ClientLogContext): void {
    this.info(`📤 Export initiated: ${type}`, context);
  }

  exportCompleted(type: string, context?: ClientLogContext): void {
    this.info(`✅ Export completed: ${type}`, context);
  }
}

export const clientLogger = new ClientLogger();

// Convenience function for performance measurement on client
export function withClientTiming<T>(
  operation: string,
  fn: () => T | Promise<T>,
  context?: ClientLogContext,
  threshold?: number
): T | Promise<T> {
  const endTiming = clientLogger.startTiming(operation, context, threshold);
  
  try {
    const result = fn();
    
    // Handle both sync and async functions
    if (result instanceof Promise) {
      return result.finally(endTiming) as T | Promise<T>;
    } else {
      endTiming();
      return result;
    }
  } catch (error) {
    endTiming();
    throw error;
  }
} 