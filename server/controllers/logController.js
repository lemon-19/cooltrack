import Log from "../models/Log.js";

export const getLogs = async (req, res) => {
  const logs = await Log.find().populate("userId", "name role");
  res.json(logs);
};
