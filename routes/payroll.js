const express = require("express");
const Salary = require("../models/Salary");
const User = require("../models/User");
const { requireLogin, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireLogin, async (req, res) => {
  try {
    const salaries = await Salary.find({
      employee: req.session.user.id,
    }).sort({ createdAt: -1 });
    const latestSalary = salaries[0] || null;
    res.render("employee/payroll", {
      salaries,
      latestSalary,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});


router.get("/admin", requireAdmin, async (req, res) => {
  try {
    const employees = await User.find({
      role: "employee",
    }).sort({ name: 1 });
    const salaries = await Salary.find()
      .populate("employee", "name employeeId department")
      .sort({ createdAt: -1 });
    res.render("admin/payroll", {
      employees,
      salaries,
      error: null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});


router.post("/admin/create", requireAdmin, async (req, res) => {
  try {
    const {
      employee,
      month,
      basicSalary,
      allowances,
      deductions,
    } = req.body;
    const basic = Number(basicSalary) || 0;
    const allowanceAmount = Number(allowances) || 0;
    const deductionAmount = Number(deductions) || 0;
    const netSalary =
      basic + allowanceAmount - deductionAmount;
    await Salary.create({
      employee,
      month,
      basicSalary: basic,
      allowances: allowanceAmount,
      deductions: deductionAmount,
      netSalary,
      status: "Processed",
    });
    res.redirect("/payroll/admin");
  } catch (error) {
    console.error(error);
    res.status(500).send("Unable to create payroll");
  }
});


module.exports = router;