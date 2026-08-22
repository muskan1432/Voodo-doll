const express = require("express");
const Attendance = require("../models/Attendance");
const { requireLogin } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireLogin, async (req, res) => {
  try {
    const records = await Attendance.find({
      employee: req.session.user.id,
    }).sort({ date: -1 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let todayRecord = await Attendance.findOne({
      employee: req.session.user.id,
      date: today,
    });

    res.render("employee/attendance", {
      records,
      todayRecord,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

router.post("/check-in", requireLogin, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await Attendance.findOne({
      employee: req.session.user.id,
      date: today,
    });

    if (existing && existing.checkIn) {
      return res.redirect("/employee/attendance");
    }

    if (existing) {
      existing.checkIn = new Date();
      existing.status = "Present";
      await existing.save();
    } else {
      await Attendance.create({
        employee: req.session.user.id,
        date: today,
        checkIn: new Date(),
        status: "Present",
      });
    }

    res.redirect("/employee/attendance");
  } catch (error) {
    console.error(error);
    res.status(500).send("Unable to check in");
  }
});

router.post("/check-out", requireLogin, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await Attendance.findOne({
      employee: req.session.user.id,
      date: today,
    });

    if (!record || !record.checkIn) {
      return res.redirect("/employee/attendance");
    }

    record.checkOut = new Date();

    await record.save();

    res.redirect("/employee/attendance");
  } catch (error) {
    console.error(error);
    res.status(500).send("Unable to check out");
  }
});

module.exports = router;