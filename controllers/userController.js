const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const Project = require("../models/productModel");
const cloudinary = require("cloudinary").v2;

//admin
exports.adminLogin = async (req, res) => {
  const DEFAULT_EMAIL = "admin@gmail.com";
  const DEFAULT_PASSWORD = "admin123";
  try {
    const { email, password, rememberMe } = req.body;

    if (email === DEFAULT_EMAIL && password === DEFAULT_PASSWORD) {
      const defaultUser = {
        _id: crypto.randomBytes(16).toString("hex"),
        email: DEFAULT_EMAIL,
        firstName: "Mr",
        lastName: "Admin",
      };

      const token = jwt.sign(defaultUser, process.env.JWT_SECRET, {
        expiresIn: rememberMe ? "90d" : process.env.JWT_EXPIRE,
      });
      const options = {
        expires: new Date(
          Date.now() + (rememberMe ? 90 : 1) * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
      };

      return res.status(200).cookie("token", token, options).json({
        success: true,
        user: defaultUser,
        token,
      });
    } else {
      if (email !== DEFAULT_EMAIL) {
        return res.status(400).json({
          success: false,
          message: "Invalid email address.",
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Incorrect password.",
        });
      }
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.getAdminAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    const totalUsers = users?.length;

    res.status(200).json({
      success: true,
      message: `Users fetched successfully. Total users: ${totalUsers}`,
      users: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.deleteUser = async (req, res) => {
  const id = req.params.id;
  const user = await User.findById(id);
  if (!user) return next(new ErrorHandler("Invalid Id", 400));
  await user.deleteOne();
  return res.status(200).json({
    success: true,
    message: "User Deleted Successfully",
  });
};

// user
exports.register = async (req, res) => {
  try {
    const { email, name, password, acceptTerms, recievedOffer } = req.body;
    let userEmail = await User.findOne({ email });

    if (userEmail) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }
    let user = await User.create({
      email,
      name,
      password,
      acceptTerms: acceptTerms || false,
      recievedOffer: recievedOffer || false,
    });

    const token = await user.generateAuthToken();

    const options = {
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    };

    const userWithoutPassword = { ...user._doc };
    delete userWithoutPassword.password;

    res.status(201).cookie("token", token, options).json({
      success: true,
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.log(error, "ERROR POSTING USER");
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User does not exist",
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect password",
      });
    }

    const token = await user.generateAuthToken();
    user.lastSeen = new Date();
    await user.save();
    const options = {
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    };

    const userWithoutPassword = { ...user._doc };
    delete userWithoutPassword.password;

    res.status(200).cookie("token", token, options).json({
      success: true,
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getSingleUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById({ _id: userId })
      .populate("followers", "name avatar")
      .populate("following", "name avatar");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getSingleUserByName = async (req, res) => {
  try {
    let username = req.params.username.replace(/-/g, " ");

    const user = await User.findOne({ name: username })
      .populate("followers", "name avatar")
      .populate("following", "name avatar");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = req.body;

    if (updates.avatar && updates.avatar.startsWith("data:image")) {
      try {
        const result = await cloudinary.uploader.upload(updates.avatar, {
          resource_type: "image",
        });
        updates.avatar = result.secure_url;
      } catch (error) {
        console.error("Error uploading avatar to Cloudinary:", error);
        return res.status(500).json({
          success: false,
          error: "Failed to upload avatar",
        });
      }
    }

    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userWithoutPassword = { ...user._doc };
    delete userWithoutPassword.password;

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: userWithoutPassword,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.deleteAvatar = async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.avatar = "";
    const updatedUser = await user.save();
    const userWithoutPassword = { ...updatedUser._doc };
    delete userWithoutPassword.password;

    res.status(200).json({
      success: true,
      message: "Avatar deleted successfully",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const userId = req.params.id;

  try {
    const user = await User.findById(userId).select("+password");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Current password is incorrect" });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.log("🚀 ~ exports.updatePassword= ~ error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email, lang } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User does not exist",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const resetPasswordExpire = Date.now() + 5 * 60 * 1000;

    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpire = resetPasswordExpire;

    await user.save({ validateBeforeSave: false });

    // const resetUrl = `http://localhost:3000/${lang}/resetPassword?token=${resetToken}`;
    const resetUrl = `https://kiff-new-frontend.vercel.app/${lang}/resetPassword?token=${resetToken}`;
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: "zilayshah35@gmail.com",
        pass: "tdcf kfkk gwqj hirm",
      },
    });
    const message = `
    <!doctype html>
    <html lang="en-US">
    <head>
        <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
        <title>Reset Password Email Template</title>
        <meta name="description" content="Reset Password Email Template.">
        <style type="text/css">
            a:hover {text-decoration: underline !important;}
        </style>
    </head>
    <body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #f2f3f8;" leftmargin="0">
        <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#f2f3f8"
            style="font-family: 'Open Sans', sans-serif;">
            <tr>
                <td>
                    <table style="background-color: #f2f3f8; max-width:670px;  margin:0 auto;" width="100%" border="0"
                        align="center" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="height:80px;">&nbsp;</td>
                        </tr>
                        <tr>
                            <td style="height:20px;">&nbsp;</td>
                        </tr>
                        <tr>
                            <td>
                                <table width="95%" border="0" align="center" cellpadding="0" cellspacing="0"
                                    style="max-width:670px;background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);">
                                    <tr>
                                        <td style="height:40px;">&nbsp;</td>
                                    </tr>
                                    <tr>
                                        <td style="padding:0 35px;">
                                            <h1 style="color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;">You have
                                                requested to reset your password</h1>
                                            <span
                                                style="display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;"></span>
                                            <p style="color:#455056; font-size:15px;line-height:24px; margin:0;">
                                                We cannot simply send you your old password. A unique link to reset your
                                                password has been generated for you. To reset your password, click the
                                                following link and follow the instructions.
                                            </p>
                                            <a href="${resetUrl}" style="background:#2e3944;text-decoration:none !important; font-weight:500; margin-top:35px; color:#fff;text-transform:uppercase; font-size:14px;padding:10px 24px;display:inline-block;border-radius:50px;">Reset Password</a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="height:40px;">&nbsp;</td>
                                    </tr>
                                </table>
                            </td>
                        <tr>
                            <td style="height:20px;">&nbsp;</td>
                        </tr>
                        <tr>
                            <td style="height:80px;">&nbsp;</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>`;

    const mailOptions = {
      from: "KiffNew",
      to: user.email,
      subject: "Password Reset Request",
      html: message,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email}`,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      success: false,
      message: "There was an error sending the email",
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password has been reset",
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      success: false,
      message: "Error resetting password",
    });
  }
};

exports.toggleFollowUser = async (req, res) => {
  try {
    const { targetUserId, loggedInUserId } = req.params;

    // Find both users
    const loggedInUser = await User.findById(loggedInUserId);
    const targetUser = await User.findById(targetUserId);
    let isFollow = false;
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Target user not found",
      });
    }

    const isFollowing = loggedInUser.following.includes(targetUserId);

    if (isFollowing) {
      loggedInUser.following = loggedInUser.following.filter(
        (id) => id.toString() !== targetUserId
      );
      targetUser.followers = targetUser.followers.filter(
        (id) => id.toString() !== loggedInUserId
      );
      await loggedInUser.save();
      await targetUser.save();

      return res.status(200).json({
        success: true,
        isFollow: false,
        message: "User unfollowed successfully",
      });
    } else {
      loggedInUser.following.push(targetUserId);
      targetUser.followers.push(loggedInUserId);
      await loggedInUser.save();
      await targetUser.save();

      return res.status(200).json({
        success: true,
        isFollow: true,
        message: "User followed successfully",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
