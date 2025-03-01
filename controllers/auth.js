// Use a direct require where it's needed in the logout function
const Role = require("../models/User");
const User = require("../models/User");

//@desc     Register user
//@route    POST /api/v1/auth/register
//@access   Public
exports.register = async (req, res, _next) => {
  try {
    const { name, email, password, role } = req.body;

    //Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    sendTokenRespond(user, 200, res);
  } catch (err) {
    res.status(400).json({ success: false });
    console.log(err.stack);
  }
};

//@desc     Login user
//@route    POST /api/v1/auth/login
//@access   Public
exports.login = async (req, res, _next) => {
  try {
    const { email, password } = req.body;

    //Validate email & password
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, msg: "Please provide an email and password" });
    }

    //Check for user
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res
        .status(400)
        .json({ success: false, msg: "Invalid credentials" });
    }

    //Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, msg: "Invalid credentials" });
    }

    sendTokenRespond(user, 200, res);
  } catch (_error) {
    res.status(401).json({
      success: false,
      msg: "Cannot convert email or password to string",
    });
  }
};

//Get token from model, create cookie and send response
const sendTokenRespond = (user, statusCOde, res) => {
  //Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }
  res
    .status(statusCOde)
    .cookie("token", token, options)
    .json({ success: true, token });
};

//@desc     Get current Logged in user
//@route    Post /api/v1/auth/me
//@access   Private
exports.getMe = async (req, res, _next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ success: true, data: user });
};

//@desc     Log user out
//@route   GET /api/v1/auth/logout
//@access  Private
exports.logout = async (req, res) => {
  try {
    // Get token from cookie parser
    const token = req.cookies.token;

    if (!token) {
      return res
        .status(400)
        .json({ success: false, msg: "No active session found" });
    }

    // Get BlackList model - make sure capitalization matches your file
    const BlackList = require("../models/BlackList");

    // Check if already blacklisted
    const checkIfBlacklisted = await BlackList.findOne({ token });
    if (checkIfBlacklisted) {
      // Already logged out, but we'll still clear the cookie
      res.cookie("token", "none", {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
      });
      return res.status(200).json({ success: true, msg: "Already logged out" });
    }

    // Add token to blacklist
    await BlackList.create({ token });

    // Clear the cookie
    res.cookie("token", "none", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    console.log("Logout successful - token blacklisted and cookie cleared");
    res.status(200).json({ success: true, msg: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ success: false, msg: "Server error during logout" });
  }
};

exports.verify = async (req, res, _next) => {
  try {
    const jwt = require("jsonwebtoken");
    const BlackList = require("../models/BlackList");

    const authHeader = req.headers.cookie;
    if (!authHeader) {
      return res
        .status(401)
        .json({ success: false, msg: "Not authorize to access this route" });
    }
    const cookie = authHeader.split("=")[1];
    const accessToken = cookie.split(";")[0];
    const checkIfBlacklisted = await BlackList.findOne({ token: accessToken });
    if (checkIfBlacklisted) {
      return res.status(401).json({ success: false, msg: "Token blacklisted" });
    }

    jwt.verify(accessToken, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ success: false, msg: "Token expired" });
      }

      const { id } = decoded;
      const user = await User.findById(id);
      const { password, ...data } = user._doc;
      req.user = data;
      _next();
    });
  } catch (err) {
    console.error("Verification error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    // Check if the user is authorized to update their information
    if (req.user.role !== "admin") {
      return res.status(401).json({
        success: false,
        message: "User is not authorized to update this user.",
      });
    }

    // Get user data from the request
    const { name, tel } = req.body;

    // Find the user by their ID and update it
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!user) {
      return res.status(400).json({ success: false });
    }
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error, couldn't update user.",
    });
  }
};
