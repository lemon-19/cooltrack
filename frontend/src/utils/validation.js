/**
 * Validation utilities
 */

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const phoneRegex = /^[0-9\s\-\+\(\)]+$/;

export const validators = {
  email: (value) => {
    if (!value) return 'Email is required';
    if (!emailRegex.test(value)) return 'Please enter a valid email address';
    return null;
  },

  phone: (value) => {
    if (!value) return null; // Optional field
    if (!phoneRegex.test(value)) return 'Please enter a valid phone number';
    return null;
  },

  required: (value, fieldName = 'This field') => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} is required`;
    }
    return null;
  },

  minLength: (value, min, fieldName = 'This field') => {
    if (value && value.length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (value, max, fieldName = 'This field') => {
    if (value && value.length > max) {
      return `${fieldName} must not exceed ${max} characters`;
    }
    return null;
  },

  number: (value, fieldName = 'This field') => {
    if (value && isNaN(value)) {
      return `${fieldName} must be a number`;
    }
    return null;
  },

  minValue: (value, min, fieldName = 'This field') => {
    if (value !== null && value !== undefined && value < min) {
      return `${fieldName} must be at least ${min}`;
    }
    return null;
  },

  maxValue: (value, max, fieldName = 'This field') => {
    if (value !== null && value !== undefined && value > max) {
      return `${fieldName} must not exceed ${max}`;
    }
    return null;
  },
};

/**
 * Error message mapper - converts API errors to user-friendly messages
 */
export const getErrorMessage = (error) => {
  // Handle different error scenarios
  if (error.response?.status === 404) {
    return 'The requested resource was not found';
  }

  if (error.response?.status === 400) {
    return error.response?.data?.message || 'Invalid request. Please check your input';
  }

  if (error.response?.status === 401) {
    return 'You are not authorized to perform this action';
  }

  if (error.response?.status === 403) {
    return 'You do not have permission to perform this action';
  }

  if (error.response?.status === 409) {
    return error.response?.data?.message || 'This resource already exists';
  }

  if (error.response?.status === 500) {
    return 'Server error. Please try again later';
  }

  if (error.message === 'Network Error') {
    return 'Network error. Please check your connection';
  }

  return error.response?.data?.message || 'Something went wrong. Please try again';
};
