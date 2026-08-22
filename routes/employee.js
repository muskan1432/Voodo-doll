const express = require("express");
const User = require("../models/User");
const { requireLogin } = require("../middleware/auth");

const router = express.Router();

router.get("/dashboard", requireLogin, async (req, res) => {
  try {
    const employee = await User.findById(req.session.user.id);

    if (!employee) {
      return res.redirect("/login");
    }

    res.render("employee/dashboard", {
      employee,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

router.get("/profile", requireLogin, async (req, res) => {
  try {
    const employee = await User.findById(req.session.user.id);

    res.render("employee/profile", {
      employee,
      message: null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

router.post("/profile/update", requireLogin, async (req, res) => {
  try {
    const { phone, address, profilePicture } = req.body;

    await User.findByIdAndUpdate(
      req.session.user.id,
      {
        phone,
        address,
        profilePicture,
      },
      { runValidators: true }
    );

    const employee = await User.findById(req.session.user.id);

    res.render("employee/profile", {
      employee,
      message: "Profile updated successfully.",
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Unable to update profile");
  }
});

module.exports = router;