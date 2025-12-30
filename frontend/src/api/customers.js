// src/api/customers.js
import api from './axios';

// Get all customers
export const getCustomers = async () => {
  const { data } = await api.get('/customers');
  return data;
};

// Get a single customer
export const getCustomer = async (id) => {
  const { data } = await api.get(`/customers/${id}`);
  return data;
};

// Create customer (admin only)
export const createCustomer = async (customerData) => {
  const { data } = await api.post('/customers', customerData);
  return data;
};

// Update customer (admin only)
export const updateCustomer = async (id, customerData) => {
  const { data } = await api.put(`/customers/${id}`, customerData);
  return data;
};

// Delete customer (admin only)
export const deleteCustomer = async (id) => {
  const { data } = await api.delete(`/customers/${id}`);
  return data;
};
