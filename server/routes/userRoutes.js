import express from "express";
import {
  getUsers,
  getTechnicians,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";

const router = express.Router();

// All routes prefixed with /api/users
router.get("/", getUsers);
router.get("/technicians", getTechnicians);
router.get("/:id", getUserById);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
