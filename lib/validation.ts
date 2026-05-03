import { z } from 'zod';

// Phone number validation regex (Uzbekistan format)
const PHONE_REGEX = /^\+998\d{9}$/;

// Common SQL injection patterns
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
  /('|(\\')|(;)|(\-\-)|(\s+(OR|AND)\s+.*=))/i,
  /(\*|\/|\%|\+|\-)/i,
];

// XSS patterns
const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<[^>]*on\w+\s*=.*>/gi,
];

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: any;
}

/**
 * Sanitize input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return String(input);
  }

  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate phone number
 */
export function validatePhoneNumber(phone: string): ValidationResult {
  const errors: string[] = [];

  if (!phone) {
    errors.push('Phone number is required');
  } else if (typeof phone !== 'string') {
    errors.push('Phone number must be a string');
  } else if (!PHONE_REGEX.test(phone)) {
    errors.push('Phone number must be in format: +998XXXXXXXXX');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];

  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }

  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (password.length > 128) {
    errors.push('Password must be less than 128 characters long');
  }

  if (/\s/.test(password)) {
    errors.push('Password cannot contain whitespace');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate name
 */
export function validateName(name: string): ValidationResult {
  const errors: string[] = [];

  if (!name) {
    errors.push('Name is required');
  } else if (typeof name !== 'string') {
    errors.push('Name must be a string');
  } else if (name.length < 2) {
    errors.push('Name must be at least 2 characters long');
  } else if (name.length > 50) {
    errors.push('Name must be less than 50 characters long');
  } else if (!/^[a-zA-Z\s\u0400-\u04FF'-]+$/.test(name)) {
    errors.push('Name can only contain letters, spaces, hyphens, and apostrophes');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: sanitizeInput(name),
  };
}

/**
 * Validate user input for SQL injection
 */
export function checkSqlInjection(input: string): ValidationResult {
  const errors: string[] = [];

  if (typeof input !== 'string') {
    return { isValid: true, errors };
  }

  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      errors.push('Input contains potentially malicious content');
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: sanitizeInput(input),
  };
}

/**
 * Validate user input for XSS
 */
export function checkXss(input: string): ValidationResult {
  const errors: string[] = [];

  if (typeof input !== 'string') {
    return { isValid: true, errors };
  }

  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(input)) {
      errors.push('Input contains potentially malicious content');
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: sanitizeInput(input),
  };
}

/**
 * Comprehensive input validation
 */
export function validateInput(input: string, type: 'phone' | 'password' | 'name' | 'general'): ValidationResult {
  // First check for common attacks
  const sqlCheck = checkSqlInjection(input);
  const xssCheck = checkXss(input);
  
  const allErrors = [...sqlCheck.errors, ...xssCheck.errors];
  
  if (allErrors.length > 0) {
    return {
      isValid: false,
      errors: allErrors,
      sanitized: xssCheck.sanitized,
    };
  }

  // Then validate based on type
  switch (type) {
    case 'phone':
      return validatePhoneNumber(input);
    case 'password':
      return validatePassword(input);
    case 'name':
      return validateName(input);
    case 'general':
      return {
        isValid: true,
        errors: [],
        sanitized: sanitizeInput(input),
      };
    default:
      return {
        isValid: true,
        errors: [],
        sanitized: sanitizeInput(input),
      };
  }
}

/**
 * Zod schemas for validation
 */
export const authSchemas = {
  register: z.object({
    phoneNumber: z.string().regex(PHONE_REGEX, 'Invalid phone number format'),
    password: z.string().min(6, 'Password must be at least 6 characters')
      .max(128, 'Password must be less than 128 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be less than 50 characters')
      .regex(/^[a-zA-Z\s\u0400-\u04FF'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  }),

  login: z.object({
    phoneNumber: z.string().regex(PHONE_REGEX, 'Invalid phone number format'),
    password: z.string().min(1, 'Password is required'),
  }),

  updateLocation: z.object({
    userId: z.string().uuid('Invalid user ID'),
    latitude: z.string().regex(/^-?\d+\.?\d*$/, 'Invalid latitude format'),
    longitude: z.string().regex(/^-?\d+\.?\d*$/, 'Invalid longitude format'),
    address: z.string().min(5, 'Address must be at least 5 characters')
      .max(200, 'Address must be less than 200 characters'),
  }),
};

/**
 * Middleware validation function
 */
export function validateRequestBody(schema: z.ZodSchema) {
  return (req: any, res: any, next: any) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => err.message),
        });
      }
      return res.status(400).json({
        error: 'Invalid request data',
      });
    }
  };
}
