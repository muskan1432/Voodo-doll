const express = require("express");
const prisma = require("../prismaClient");
const { verifyToken, requireRole } = require("../middleware/auth.middleware");

const router = express.Router();
router.use(verifyToken);

// GET /api/payroll/me - employee views their own current salary structure (read-only)
router.get("/me", async (req, res) => {
  const latest = await prisma.salaryStructure.findFirst({
    where: { employeeId: req.user.employeeId },
    orderBy: { effectiveFrom: "desc" },
  });
  res.json(latest);
});

// GET /api/payroll - admin views payroll for all employees (latest per employee)
router.get("/", requireRole("ADMIN"), async (req, res) => {
  const employees = await prisma.employee.findMany({
    select: {
      id: true,
      fullName: true,
      salaryStructures: {
        orderBy: { effectiveFrom: "desc" },
        take: 1,
      },
    },
  });
  res.json(employees);
});

// GET /api/payroll/:employeeId - admin views one employee's salary history
router.get("/:employeeId", requireRole("ADMIN"), async (req, res) => {
  const history = await prisma.salaryStructure.findMany({
    where: { employeeId: Number(req.params.employeeId) },
    orderBy: { effectiveFrom: "desc" },
  });
  res.json(history);
});

// POST /api/payroll/:employeeId - admin adds a new salary structure (kept as history, not overwritten)
router.post("/:employeeId", requireRole("ADMIN"), async (req, res) => {
  const { basic, hra, allowances = 0, deductions = 0, effectiveFrom } = req.body;

  if (basic === undefined || hra === undefined || !effectiveFrom) {
    return res.status(400).json({ error: "basic, hra, and effectiveFrom are required" });
  }

  const netSalary = Number(basic) + Number(hra) + Number(allowances) - Number(deductions);

  const record = await prisma.salaryStructure.create({
    data: {
      employeeId: Number(req.params.employeeId),
      basic,
      hra,
      allowances,
      deductions,
      netSalary,
      effectiveFrom: new Date(effectiveFrom),
      updatedByAdminId: req.user.id,
    },
  });

  res.status(201).json(record);
});

module.exports = router;
