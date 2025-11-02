import User from "../models/User.js";
import bcrypt from "bcryptjs";

// ✅ Get all users (admin + technicians)
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password"); // Hide password
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get all technicians only
export const getTechnicians = async (req, res) => {
  try {
    const techs = await User.find({ role: "technician" }).select("-password");
    res.json(techs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get single user by ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Create new user (admin can add technician or admin)
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashed, role });
    await user.save();

    res.status(201).json({
      message: "User created successfully",
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Update user
export const updateUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const updateData = { name, email, role };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    }).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User updated", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Delete user
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
