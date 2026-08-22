const express = require("express");
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.use(requireAdmin);


router.get("/dashboard", async (req, res) => {
  try {
    const employeeCount = await User.countDocuments({
      role: "employee",
    });
    const pendingLeaves = await Leave.countDocuments({
      status: "Pending",
    });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAttendance = await Attendance.countDocuments({
      date: today,
      status: "Present",
    });
    const employees = await User.find({
      role: "employee",
    }).sort({ createdAt: -1 }).limit(5);
    res.render("admin/dashboard", {
      employeeCount,
      pendingLeaves,
      todayAttendance,
      employees,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});


router.get("/employees", async (req, res) => {
  try {
    const search = (req.query.search || "").trim();
    let query = {
      role: "employee",
    };
    if (search) {
      query.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          email: {
            $regex: search,
            $options: "i",
          },
        },
        {
          employeeId: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const employees = await User.find(query)
      .sort({ createdAt: -1 });

    res.render("admin/employees", {
      employees,
      search,
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});


router.get("/employees/:id", async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);

    if (!employee) {
      return res.status(404).send("Employee not found");
    }

    const attendance = await Attendance.find({
      employee: employee._id,
    }).sort({ date: -1 }).limit(10);

    const leaves = await Leave.find({
      employee: employee._id,
    }).sort({ createdAt: -1 }).limit(10);

    res.render("admin/employee-detail", {
      employee,
      attendance,
      leaves,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});


router.get("/leaves", async (req, res) => {
  try {
    const leaves = await Leave.find()
      .populate("employee", "name employeeId department")
      .sort({ createdAt: -1 });

    res.render("admin/leaves", {
      leaves,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});


router.post("/leaves/:id/approve", async (req, res) => {
  try {
    await Leave.findByIdAndUpdate(req.params.id, {
      status: "Approved",
      adminComment: req.body.adminComment || "",
    });
    res.redirect("/admin/leaves");
  } catch (error) {
    console.error(error);
    res.status(500).send("Unable to approve leave");
  }
});



router.post("/leaves/:id/reject", async (req, res) => {
  try {
    await Leave.findByIdAndUpdate(req.params.id, {
      status: "Rejected",
      adminComment: req.body.adminComment || "",
    });
    res.redirect("/admin/leaves");
  } catch (error) {
    console.error(error);
    res.status(500).send("Unable to reject leave");
  }
});


router.post("/employees/:id/update", async (req, res) => {
  try {
    const {
      name,
      phone,
      address,
      department,
      jobTitle,
      salary,
    } = req.body;
    await User.findByIdAndUpdate(req.params.id, {
      name,
      phone,
      address,
      department,
      jobTitle,
      salary: Number(salary) || 0,
    });
    res.redirect(`/admin/employees/${req.params.id}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Unable to update employee");
  }
});


router.get("/attendance", async (req, res) => {
  try {
    const attendance = await Attendance.find()
      .populate("employee", "name employeeId department")
      .sort({ date: -1 });

    res.render("admin/attendance", {
      attendance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});


router.get("/admins", async (req, res) => {
  try {
    const admins = await User.find({
      role: "admin",
    }).select("-password").sort({ createdAt: -1 });

    res.render("admin/admins", {
      admins,
      error: null,
      success: null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});


router.post("/admins/create", async (req, res) => {
  try {
    const bcrypt = require("bcryptjs");
    const {
      name,
      email,
      password,
      department,
      jobTitle,
    } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const admins = await User.find({
        role: "admin",
      }).select("-password");

      return res.render("admin/admins", {
        admins,
        error: "An account with this email already exists.",
        success: null,
      });
    }
    if (!password || password.length < 6) {
      const admins = await User.find({
        role: "admin",
      }).select("-password");
      return res.render("admin/admins", {
        admins,
        error: "Password must contain at least 6 characters.",
        success: null,
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const adminCount = await User.countDocuments({
      role: "admin",
    });

    const employeeId = `ADMIN${String(adminCount + 1).padStart(3, "0")}`;
    await User.create({
      employeeId,
      name,
      email,
      password: hashedPassword,
      role: "admin",
      department: department || "Administration",
      jobTitle: jobTitle || "HR Administrator",
    });
    res.redirect("/admin/admins");
  } catch (error) {
    console.error(error);
    res.status(500).send("Unable to create administrator");
  }
});

module.exports = router;