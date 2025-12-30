import { useState, useCallback } from 'react';
import { getJobs, getJobStats } from '../api/jobs';

/**
 * Custom hook for jobs management
 * Centralizes job fetching, filtering, and stats
 */
export const useJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      const jobData = await getJobs();
      setJobs(jobData.jobs);
      setFiltered(jobData.jobs);
      await loadStats();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to load jobs:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const jobStats = await getJobStats();
      setStats(jobStats.stats);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to load stats:', error);
    }
  }, []);

  const filterJobs = useCallback((search = '', status = 'all') => {
    let result = [...jobs];
    
    if (search) {
      result = result.filter(j =>
        j.jobNumber?.toLowerCase().includes(search.toLowerCase()) ||
        j.customerName?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (status !== 'all') {
      result = result.filter(j => j.status === status);
    }
    
    setFiltered(result);
  }, [jobs]);

  return {
    jobs,
    filtered,
    loading,
    stats,
    loadJobs,
    loadStats,
    filterJobs,
    setJobs,
  };
};
