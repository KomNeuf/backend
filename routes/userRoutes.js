const express = require("express");
const { Router } = express;
const catchAsync = require("../middlewares/catchAsync");
const authMiddleware = require("../middlewares/authentication");
const {
  register,
  getAdminAllUsers,
  getSingleUser,
  login,
  deleteUser,
  updateUser,
  adminLogin,
  updatePassword,
  forgotPassword,
  resetPassword,
  toggleFollowUser,
  deleteAvatar,
  getSingleUserByName,
} = require("../controllers/userController");

const userRoutes = Router();
//admin
userRoutes.post("/adminLogin", catchAsync(adminLogin));

//user
userRoutes.post("/register", catchAsync(register));
userRoutes.put("/:id", catchAsync(updateUser));
userRoutes.put("/delete-avatar/:id", catchAsync(deleteAvatar));
userRoutes.get("/getAdminAllUsers", catchAsync(getAdminAllUsers));
userRoutes.get("/userByName/:username", catchAsync(getSingleUserByName));
userRoutes.get("/getUser/:id", catchAsync(getSingleUser));
userRoutes.post("/login", catchAsync(login));
userRoutes.delete("/:id", catchAsync(deleteUser));
userRoutes.put("/update-password/:id", catchAsync(updatePassword));
userRoutes.post("/forgot-password", forgotPassword);
userRoutes.put("/reset-password/:token", resetPassword);
userRoutes.put("/follow/:loggedInUserId/:targetUserId", toggleFollowUser);

module.exports = { userRoutes };
