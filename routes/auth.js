const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();

router.get("/login", (req, res) => {
  res.render("login", { error: null });
});

router.get("/signup", (req, res) => {
  res.render("signup", { error: null });
});

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.render("signup", {
        error: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const employeeId = "EMP" + Date.now().toString().slice(-6);

    const user = await User.create({
      employeeId,
      name,
      email,
      password: hashedPassword,
    });

    req.session.user = {
      id: user._id,
      name: user.name,
      role: user.role,
      employeeId: user.employeeId,
    };

    res.redirect("/employee/dashboard");
  } catch (error) {
    console.error(error);
    res.render("signup", {
      error: "Something went wrong",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.render("login", {
        error: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.render("login", {
        error: "Invalid email or password",
      });
    }

    req.session.user = {
      id: user._id,
      name: user.name,
      role: user.role,
      employeeId: user.employeeId,
    };

    if (user.role === "admin") {
      return res.redirect("/admin/dashboard");
    }

    res.redirect("/employee/dashboard");
  } catch (error) {
    console.error(error);
    res.render("login", {
      error: "Something went wrong",
    });
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

module.exports = router;