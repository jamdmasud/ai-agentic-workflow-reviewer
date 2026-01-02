/**
 * Network error handling utilities with retry mechanisms
 */

export interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export interface NetworkError extends Error {
  code?: string;
  status?: number;
  isRetryable: boolean;
  attempt?: number;
}

export class NetworkErrorHandler {
  private static readonly DEFAULT_RETRY_OPTIONS: RetryOptions = {
    maxAttempts: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    retryableErrors: [
      'NETWORK_ERROR',
      'TIMEOUT',
      'CONNECTION_REFUSED',
      'DNS_ERROR',
      'ECONNRESET',
      'ENOTFOUND',
      'ETIMEDOUT'
    ]
  };

  /**
   * Execute a function with retry logic for network errors
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const config = { ...this.DEFAULT_RETRY_OPTIONS, ...options };
    let lastError: NetworkError;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const networkError = this.classifyError(error, attempt);
        lastError = networkError;

        // Don't retry if error is not retryable or we've reached max attempts
        if (!networkError.isRetryable || attempt === config.maxAttempts) {
          throw networkError;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt - 1),
          config.maxDelayMs
        );

        // Add jitter to prevent thundering herd
        const jitteredDelay = delay + Math.random() * 1000;

        console.warn(
          `Network operation failed (attempt ${attempt}/${config.maxAttempts}). ` +
          `Retrying in ${Math.round(jitteredDelay)}ms...`,
          networkError
        );

        await this.sleep(jitteredDelay);
      }
    }

    throw lastError!;
  }

  /**
   * Classify an error to determine if it's network-related and retryable
   */
  private static classifyError(error: any, attempt: number): NetworkError {
    const networkError = error as NetworkError;
    networkError.attempt = attempt;

    // Check for common network error patterns
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code?.toUpperCase() || '';

    // Network connectivity errors
    if (
      errorCode.includes('ECONNREFUSED') ||
      errorCode.includes('ENOTFOUND') ||
      errorCode.includes('ETIMEDOUT') ||
      errorCode.includes('ECONNRESET') ||
      errorMessage.includes('network error') ||
      errorMessage.includes('connection refused') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('dns')
    ) {
      networkError.isRetryable = true;
      networkError.code = errorCode || 'NETWORK_ERROR';
      return networkError;
    }

    // HTTP status codes that are retryable
    if (error.status) {
      const status = error.status;
      if (status >= 500 || status === 408 || status === 429) {
        networkError.isRetryable = true;
        networkError.code = `HTTP_${status}`;
        return networkError;
      }
    }

    // Service unavailable or rate limiting
    if (
      errorMessage.includes('service unavailable') ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('too many requests')
    ) {
      networkError.isRetryable = true;
      networkError.code = 'SERVICE_UNAVAILABLE';
      return networkError;
    }

    // Default to non-retryable
    networkError.isRetryable = false;
    networkError.code = errorCode || 'UNKNOWN_ERROR';
    return networkError;
  }

  /**
   * Check network connectivity
   */
  static async checkConnectivity(): Promise<boolean> {
    try {
      // Try to fetch a small resource to test connectivity
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get user-friendly error message for network errors
   */
  static getUserFriendlyMessage(error: NetworkError): string {
    if (!error.isRetryable) {
      return error.message || 'An unexpected error occurred';
    }

    switch (error.code) {
      case 'ECONNREFUSED':
      case 'CONNECTION_REFUSED':
        return 'Unable to connect to the analysis service. Please check your internet connection and try again.';
      
      case 'ENOTFOUND':
      case 'DNS_ERROR':
        return 'Network connectivity issue detected. Please check your internet connection.';
      
      case 'ETIMEDOUT':
      case 'TIMEOUT':
        return 'The request timed out. This may be due to network congestion or service overload.';
      
      case 'SERVICE_UNAVAILABLE':
        return 'The analysis service is temporarily unavailable. Please try again in a few moments.';
      
      case 'HTTP_429':
        return 'Too many requests. Please wait a moment before trying again.';
      
      case 'HTTP_500':
      case 'HTTP_502':
      case 'HTTP_503':
      case 'HTTP_504':
        return 'The analysis service is experiencing issues. Please try again later.';
      
      default:
        return `Network error occurred${error.attempt ? ` (attempt ${error.attempt})` : ''}. Please check your connection and try again.`;
    }
  }

  /**
   * Get recovery suggestions for network errors
   */
  static getRecoverySuggestions(error: NetworkError): string[] {
    const suggestions: string[] = [];

    if (error.isRetryable) {
      suggestions.push('Try again in a few moments');
    }

    switch (error.code) {
      case 'ECONNREFUSED':
      case 'CONNECTION_REFUSED':
      case 'ENOTFOUND':
      case 'DNS_ERROR':
        suggestions.push(
          'Check your internet connection',
          'Verify that you can access other websites',
          'Try switching to a different network if available'
        );
        break;
      
      case 'ETIMEDOUT':
      case 'TIMEOUT':
        suggestions.push(
          'Check for network congestion',
          'Try using a faster internet connection',
          'Reduce the complexity of your workflow if possible'
        );
        break;
      
      case 'SERVICE_UNAVAILABLE':
      case 'HTTP_500':
      case 'HTTP_502':
      case 'HTTP_503':
      case 'HTTP_504':
        suggestions.push(
          'Wait a few minutes and try again',
          'Check the service status page if available',
          'Contact support if the issue persists'
        );
        break;
      
      case 'HTTP_429':
        suggestions.push(
          'Wait before making another request',
          'Reduce the frequency of your requests'
        );
        break;
    }

    if (suggestions.length === 0) {
      suggestions.push('Contact support if the problem continues');
    }

    return suggestions;
  }

  /**
   * Sleep utility for delays
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Decorator for adding network error handling to agent methods
 */
export function withNetworkErrorHandling(options?: Partial<RetryOptions>) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await NetworkErrorHandler.withRetry(
          () => method.apply(this, args),
          options
        );
      } catch (error) {
        const networkError = error as NetworkError;
        
        // Add context about which agent method failed
        networkError.message = `${target.constructor.name}.${propertyName}: ${networkError.message}`;
        
        throw networkError;
      }
    };

    return descriptor;
  };
}