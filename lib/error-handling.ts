import { logger } from './data-security';

/**
 * Global error handling service
 * Provides consistent error handling across the application
 */

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  additionalData?: Record<string, any>;
}

export interface ErrorReport {
  id: string;
  timestamp: string;
  type: 'client' | 'server' | 'network' | 'validation' | 'authentication' | 'unknown';
  message: string;
  stack?: string;
  context?: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  retryCount: number;
}

export class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private errorReports: Map<string, ErrorReport> = new Map();
  private errorThresholds = {
    low: 10,      // 10 errors per hour
    medium: 5,    // 5 errors per hour
    high: 2,      // 2 errors per hour
    critical: 1,  // 1 error per hour
  };
  private errorCounts: Map<string, { count: number; lastOccurrence: number }> = new Map();
  private monitoringEndpoint?: string;

  static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  setMonitoringEndpoint(endpoint: string): void {
    this.monitoringEndpoint = endpoint;
  }

  /**
   * Handle and categorize an error
   */
  handleError(error: Error | string, context?: ErrorContext): string {
    const errorReport = this.createErrorReport(error, context);
    
    // Log the error
    this.logError(errorReport);
    
    // Check if error threshold is exceeded
    this.checkErrorThreshold(errorReport);
    
    // Send to monitoring service
    this.sendToMonitoring(errorReport);
    
    // Store error report
    this.errorReports.set(errorReport.id, errorReport);
    
    return errorReport.id;
  }

  /**
   * Create a standardized error report
   */
  private createErrorReport(error: Error | string, context?: ErrorContext): ErrorReport {
    const id = this.generateErrorId();
    const timestamp = new Date().toISOString();
    
    let message: string;
    let stack?: string;
    
    if (error instanceof Error) {
      message = error.message;
      stack = error.stack;
    } else {
      message = error;
    }
    
    const type = this.categorizeError(message, stack);
    const severity = this.determineSeverity(message, type);
    
    return {
      id,
      timestamp,
      type,
      message,
      stack,
      context,
      severity,
      resolved: false,
      retryCount: 0,
    };
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Categorize error type
   */
  private categorizeError(message: string, stack?: string): ErrorReport['type'] {
    if (message.includes('Network') || message.includes('fetch') || message.includes('timeout')) {
      return 'network';
    }
    
    if (message.includes('401') || message.includes('403') || message.includes('Unauthorized') || message.includes('Forbidden')) {
      return 'authentication';
    }
    
    if (message.includes('validation') || message.includes('Invalid') || message.includes('required')) {
      return 'validation';
    }
    
    if (message.includes('500') || message.includes('Internal Server Error') || stack?.includes('server/')) {
      return 'server';
    }
    
    if (message.includes('React') || stack?.includes('components/') || stack?.includes('app/')) {
      return 'client';
    }
    
    return 'unknown';
  }

  /**
   * Determine error severity
   */
  private determineSeverity(message: string, type: ErrorReport['type']): ErrorReport['severity'] {
    // Critical errors
    if (message.includes('crashed') || message.includes('fatal') || type === 'authentication') {
      return 'critical';
    }
    
    // High severity errors
    if (message.includes('500') || type === 'server' || type === 'network') {
      return 'high';
    }
    
    // Medium severity errors
    if (type === 'validation' || message.includes('404')) {
      return 'medium';
    }
    
    // Low severity errors
    return 'low';
  }

  /**
   * Log error with appropriate level
   */
  private logError(errorReport: ErrorReport): void {
    const logData = {
      id: errorReport.id,
      type: errorReport.type,
      message: errorReport.message,
      context: errorReport.context,
      severity: errorReport.severity,
    };

    switch (errorReport.severity) {
      case 'critical':
        logger.error('Critical error occurred', logData);
        break;
      case 'high':
        logger.error('High severity error occurred', logData);
        break;
      case 'medium':
        logger.warn('Medium severity error occurred', logData);
        break;
      case 'low':
        logger.info('Low severity error occurred', logData);
        break;
    }
  }

  /**
   * Check if error threshold is exceeded
   */
  private checkErrorThreshold(errorReport: ErrorReport): void {
    const key = `${errorReport.type}_${errorReport.severity}`;
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    const current = this.errorCounts.get(key) || { count: 0, lastOccurrence: 0 };
    
    // Reset count if it's been more than an hour
    if (now - current.lastOccurrence > oneHour) {
      current.count = 0;
    }
    
    current.count++;
    current.lastOccurrence = now;
    this.errorCounts.set(key, current);
    
    const threshold = this.errorThresholds[errorReport.severity];
    
    if (current.count > threshold) {
      logger.error('Error threshold exceeded', {
        type: errorReport.type,
        severity: errorReport.severity,
        count: current.count,
        threshold,
      });
      
      // In a real app, this might trigger alerts, notifications, or automatic responses
      this.triggerEmergencyResponse(errorReport);
    }
  }

  /**
   * Trigger emergency response for critical errors
   */
  private triggerEmergencyResponse(errorReport: ErrorReport): void {
    // In a real app, this might:
    // - Send alerts to developers
    // - Enable maintenance mode
    // - Rollback recent changes
    // - Scale up resources
    
    logger.error('Emergency response triggered', {
      errorId: errorReport.id,
      type: errorReport.type,
      severity: errorReport.severity,
    });
  }

  /**
   * Send error to monitoring service
   */
  private sendToMonitoring(errorReport: ErrorReport): void {
    if (!this.monitoringEndpoint) {
      // For development, just log to console
      console.log('[MONITORING]', JSON.stringify(errorReport));
      return;
    }
    
    // In production, this would send to a real monitoring service
    try {
      // Example: await fetch(this.monitoringEndpoint, { ... });
      console.log('[MONITORING]', JSON.stringify(errorReport));
    } catch (error) {
      logger.error('Failed to send error to monitoring service', error);
    }
  }

  /**
   * Mark error as resolved
   */
  resolveError(errorId: string): void {
    const errorReport = this.errorReports.get(errorId);
    if (errorReport) {
      errorReport.resolved = true;
      logger.info('Error resolved', { errorId });
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    unresolved: number;
  } {
    const stats = {
      total: this.errorReports.size,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      unresolved: 0,
    };

    this.errorReports.forEach(report => {
      stats.byType[report.type] = (stats.byType[report.type] || 0) + 1;
      stats.bySeverity[report.severity] = (stats.bySeverity[report.severity] || 0) + 1;
      if (!report.resolved) {
        stats.unresolved++;
      }
    });

    return stats;
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 10): ErrorReport[] {
    const errors = Array.from(this.errorReports.values());
    return errors
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Clear old errors (older than 24 hours)
   */
  clearOldErrors(): void {
    const oneDay = 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    this.errorReports.forEach((report, id) => {
      const reportTime = new Date(report.timestamp).getTime();
      if (now - reportTime > oneDay) {
        this.errorReports.delete(id);
      }
    });
  }

  /**
   * Create user-friendly error message
   */
  getUserFriendlyMessage(error: Error | string): string {
    const message = error instanceof Error ? error.message : error;
    
    // Network errors
    if (message.includes('Network request failed')) {
      return 'Internetga ulanishda xatolik yuz berdi. Internet aloqangizni tekshiring.';
    }
    
    if (message.includes('timeout')) {
      return 'So\'rov uzoq vaqt davom etdi. Iltimos, qayta urinib ko\'ring.';
    }
    
    // Authentication errors
    if (message.includes('401') || message.includes('Unauthorized')) {
      return 'Sessiya muddati tugadi. Iltimos, qayta kirishing.';
    }
    
    if (message.includes('403') || message.includes('Forbidden')) {
      return 'Bu amalni bajarish uchun ruxsatingiz yo\'q.';
    }
    
    // Server errors
    if (message.includes('500') || message.includes('Internal Server Error')) {
      return 'Serverda xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko\'ring.';
    }
    
    // Not found errors
    if (message.includes('404') || message.includes('Not found')) {
      return 'So\'ralgan resurs topilmadi.';
    }
    
    // Validation errors
    if (message.includes('validation') || message.includes('Invalid')) {
      return 'Kiritilgan ma\'lumotlar noto\'g\'ri. Iltimos, tekshirib qayta urinib ko\'ring.';
    }
    
    // Generic message
    return 'Kutilmagan xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.';
  }
}

// Export singleton instance
export const errorHandlingService = ErrorHandlingService.getInstance();

// Export convenience functions
export const handleError = (error: Error | string, context?: ErrorContext) => {
  return errorHandlingService.handleError(error, context);
};

export const getUserFriendlyMessage = (error: Error | string) => {
  return errorHandlingService.getUserFriendlyMessage(error);
};

export const getErrorStats = () => {
  return errorHandlingService.getErrorStats();
};

export const getRecentErrors = (limit?: number) => {
  return errorHandlingService.getRecentErrors(limit);
};
