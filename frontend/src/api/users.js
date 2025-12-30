import api from "./axios";

// Get all users (admin only)
export const getUsers = async () => {
  const res = await api.get("/users");
  return res.data;
};

// Get all technicians only (for assigning jobs)
export const getTechnicians = async () => {
  const res = await api.get("/users/technicians");
  return res.data;
};

// Get a single user by ID
export const getUserById = async (id) => {
  const res = await api.get(`/users/${id}`);
  return res.data;
};

// Create a user (admin)
export const createUser = async (data) => {
  const res = await api.post("/users", data);
  return res.data;
};

// Update user
export const updateUser = async (id, data) => {
  const res = await api.put(`/users/${id}`, data);
  return res.data;
};

// Delete user
export const deleteUser = async (id) => {
  const res = await api.delete(`/users/${id}`);
  return res.data;
};
