const express = require("express");
const router = express.Router();
const userModel = require("../models/user");

router.get("/", (req, res) => {
  res.json(userModel.getAllUsers());
});

router.get("/:id", (req, res) => {
  const user = userModel.getUserById(req.params.id);
  user ? res.json(user) : res.status(404).json({ message: "User not found" });
});

router.post("/", (req, res) => {
  const newUser = userModel.createUser(req.body);
  res.status(201).json(newUser);
});

router.put("/:id", (req, res) => {
  const updatedUser = userModel.updateUser(req.params.id, req.body);
  updatedUser
    ? res.json(updatedUser)
    : res.status(404).json({ message: "User not found" });
});

router.delete("/:id", (req, res) => {
  const deletedUser = userModel.deleteUser(req.params.id);
  deletedUser
    ? res.json(deletedUser)
    : res.status(404).json({ message: "User not found" });
});

module.exports = router;
