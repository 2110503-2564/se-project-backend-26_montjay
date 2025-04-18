// Use a direct require where it's needed in the logout function
const User = require("../models/User");
const Blacklist = require("../models/Blacklist");

//@desc     Register user
//@route    POST /api/v1/auth/register
//@access   Public
exports.register = async (req, res, _next) => {
  try {
    const { name, email, password, role, tel } = req.body;

    //Create user
    const user = await User.create({
      name,
      email,
      password,
      tel,
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

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, msg: "Please provide an email and password" });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res
        .status(400)
        .json({ success: false, msg: "Invalid credentials" });
    }

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

const sendTokenRespond = (user, statusCOde, res) => {
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
    const token = req.cookies.token;

    if (!token) {
      return res
        .status(400)
        .json({ success: false, msg: "No active session found" });
    }

    await Blacklist.create({ token });

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

exports.updateUser = async (req, res) => {
  try {
    if (req.params.id !== req.user.id && req.user.role !== "admin") {
      return res.status(401).json({
        success: false,
        message: "User is not authorized to update this user.",
      });
    }

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
      message: "please check your tel.",
    });
  }
};
