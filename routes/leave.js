const express = require("express");
const Leave = require("../models/Leave");
const { requireLogin } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireLogin, async (req, res) => {
  try {
    const leaves = await Leave.find({
      employee: req.session.user.id,
    }).sort({ createdAt: -1 });

    res.render("employee/leave", {
      leaves,
      error: null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

router.post("/apply", requireLogin, async (req, res) => {
  try {
    const { type, startDate, endDate, reason } = req.body;

    if (new Date(endDate) < new Date(startDate)) {
      const leaves = await Leave.find({
        employee: req.session.user.id,
      }).sort({ createdAt: -1 });

      return res.render("employee/leave", {
        leaves,
        error: "End date cannot be before start date.",
      });
    }

    await Leave.create({
      employee: req.session.user.id,
      type,
      startDate,
      endDate,
      reason,
    });

    res.redirect("/employee/leave");
  } catch (error) {
    console.error(error);
    res.status(500).send("Unable to submit leave request");
  }
});

module.exports = router;