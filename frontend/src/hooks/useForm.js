import { useState, useCallback } from 'react';

/**
 * Custom hook for form management
 * Handles form state, validation, and submission
 */
export const useForm = (initialValues, onSubmit) => {
  const [form, setForm] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? parseFloat(value) || 0 : value;
    setForm(prev => ({
      ...prev,
      [name]: newValue,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null,
      }));
    }
  }, [errors]);

  const validate = useCallback((customValidation = {}) => {
    const newErrors = {};

    // Default validations
    if (customValidation.email && form.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        newErrors.email = 'Invalid email format';
      }
    }

    if (customValidation.required) {
      customValidation.required.forEach(field => {
        if (!form[field]) {
          newErrors[field] = `${field} is required`;
        }
      });
    }

    if (customValidation.minLength) {
      Object.entries(customValidation.minLength).forEach(([field, min]) => {
        if (form[field] && form[field].length < min) {
          newErrors[field] = `${field} must be at least ${min} characters`;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleSubmit = useCallback(async (e, customValidation = {}) => {
    e?.preventDefault?.();
    
    if (!validate(customValidation)) return;

    try {
      setLoading(true);
      await onSubmit(form);
      setForm(initialValues);
      setErrors({});
    } catch (error) {
      if (error.response?.data?.validation) {
        setErrors(error.response.data.validation);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, [form, initialValues, onSubmit, validate]);

  const resetForm = useCallback(() => {
    setForm(initialValues);
    setErrors({});
  }, [initialValues]);

  return {
    form,
    setForm,
    errors,
    setErrors,
    loading,
    handleChange,
    handleSubmit,
    validate,
    resetForm,
  };
};
