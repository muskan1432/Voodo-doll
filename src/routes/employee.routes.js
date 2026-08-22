const express = require("express");
const prisma = require("../prismaClient");
const { verifyToken, requireRole } = require("../middleware/auth.middleware");

const router = express.Router();
router.use(verifyToken);

// GET /api/employees/me - employee views their own profile
router.get("/me", async (req, res) => {
  const employee = await prisma.employee.findUnique({
    where: { id: req.user.employeeId },
    include: { user: { select: { email: true, employeeCode: true, role: true } } },
  });
  res.json(employee);
});

// PUT /api/employees/me - employee edits limited fields only
router.put("/me", async (req, res) => {
  const { phone, address, profilePictureUrl } = req.body;

  const updated = await prisma.employee.update({
    where: { id: req.user.employeeId },
    data: { phone, address, profilePictureUrl },
  });

  res.json(updated);
});

// GET /api/employees - admin views all employees
router.get("/", requireRole("ADMIN"), async (req, res) => {
  const employees = await prisma.employee.findMany({
    include: { user: { select: { email: true, employeeCode: true, role: true } } },
  });
  res.json(employees);
});

// GET /api/employees/:id - admin views any employee's full profile
router.get("/:id", requireRole("ADMIN"), async (req, res) => {
  const employee = await prisma.employee.findUnique({
    where: { id: Number(req.params.id) },
    include: { user: { select: { email: true, employeeCode: true, role: true } } },
  });
  if (!employee) return res.status(404).json({ error: "Employee not found" });
  res.json(employee);
});

// PUT /api/employees/:id - admin edits any field on any employee
router.put("/:id", requireRole("ADMIN"), async (req, res) => {
  const { fullName, phone, address, profilePictureUrl, department, designation, dateOfJoining } = req.body;

  const updated = await prisma.employee.update({
    where: { id: Number(req.params.id) },
    data: { fullName, phone, address, profilePictureUrl, department, designation, dateOfJoining },
  });

  res.json(updated);
});

module.exports = router;
