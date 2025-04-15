const express = require("express");

const { register, registerDentist, login, logout, getMe, updateUser} = require("../controllers/auth");

const router = express.Router();

const { protect, authorize } = require("../middleware/auth");

router.post("/register", register);
router.post("/registerDent", registerDentist);
router.post("/login", login);
router.get("/logout", protect, logout);
router.get("/me", protect, getMe);
router.put("/updateUser/:id", protect, authorize("admin","user"), updateUser); 
 


module.exports = router;
