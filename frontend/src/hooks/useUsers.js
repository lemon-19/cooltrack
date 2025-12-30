import { useState, useCallback } from 'react';
import axiosInstance from '../api/axios';

/**
 * Custom hook for users management
 * Centralizes user fetching, filtering, and CRUD operations
 */
export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get('/users');
      setUsers(data.users);
      setFiltered(data.users);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to load users:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const filterUsers = useCallback((search = '', role = 'all', status = 'all') => {
    let result = [...users];

    if (search) {
      result = result.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (role !== 'all') {
      result = result.filter(u => u.role === role);
    }

    if (status !== 'all') {
      result = result.filter(u =>
        status === 'active' ? u.isActive : !u.isActive
      );
    }

    setFiltered(result);
  }, [users]);

  const addUser = useCallback((user) => {
    setUsers(prev => [user, ...prev]);
    setFiltered(prev => [user, ...prev]);
  }, []);

  const updateUser = useCallback((userId, updatedUser) => {
    setUsers(prev => prev.map(u => u._id === userId ? updatedUser : u));
    setFiltered(prev => prev.map(u => u._id === userId ? updatedUser : u));
  }, []);

  const deleteUser = useCallback((userId) => {
    setUsers(prev => prev.filter(u => u._id !== userId));
    setFiltered(prev => prev.filter(u => u._id !== userId));
  }, []);

  return {
    users,
    filtered,
    loading,
    loadUsers,
    filterUsers,
    addUser,
    updateUser,
    deleteUser,
    setUsers,
  };
};
