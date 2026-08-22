const express = require("express");
const multer = require("multer");
const path = require("path");
const User = require("../models/User");
const { requireLogin } = require("../middleware/auth");


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads");
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    cb(
      null,
      `${req.session.user.id}-${Date.now()}${extension}`
    );
  },
});


const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG and WebP images are allowed."));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});


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


router.post("/profile/update", requireLogin, upload.single("profilePicture"),async (req, res) => {
  try {
      const { phone, address } = req.body;
      const updateData = {
        phone,
        address,
      };
      if (req.file) {
        updateData.profilePicture = `/uploads/${req.file.filename}`;
      }
      await User.findByIdAndUpdate(
        req.session.user.id,
        updateData,
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
  }
);

module.exports = router;