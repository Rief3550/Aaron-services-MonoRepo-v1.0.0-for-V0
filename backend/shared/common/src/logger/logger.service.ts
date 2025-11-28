type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
  constructor(private readonly context?: string) {}

  private formatMessage(level: LogLevel, message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString();
    const context = this.context ? `[${this.context}]` : '';
    const logMessage = `${timestamp} ${level.toUpperCase()} ${context} ${message}`;
    
    console[level](logMessage, ...args);
  }

  debug(message: string, ...args: any[]): void {
    this.formatMessage('debug', message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.formatMessage('info', message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.formatMessage('warn', message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.formatMessage('error', message, ...args);
  }
}

