const express = require("express");
const prisma = require("../prismaClient");
const { verifyToken, requireRole } = require("../middleware/auth.middleware");

const router = express.Router();
router.use(verifyToken);

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// POST /api/attendance/checkin - employee checks in for today
router.post("/checkin", async (req, res) => {
  const today = startOfToday();

  const existing = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId: req.user.employeeId, date: today } },
  });
  if (existing) {
    return res.status(409).json({ error: "Already checked in today" });
  }

  const record = await prisma.attendance.create({
    data: {
      employeeId: req.user.employeeId,
      date: today,
      checkIn: new Date(),
      status: "PRESENT",
    },
  });

  res.status(201).json(record);
});

// POST /api/attendance/checkout - employee checks out for today
router.post("/checkout", async (req, res) => {
  const today = startOfToday();

  const record = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId: req.user.employeeId, date: today } },
  });
  if (!record) {
    return res.status(404).json({ error: "No check-in found for today" });
  }

  const updated = await prisma.attendance.update({
    where: { id: record.id },
    data: { checkOut: new Date() },
  });

  res.json(updated);
});

// GET /api/attendance/me - employee views their own attendance (daily/weekly list)
router.get("/me", async (req, res) => {
  const records = await prisma.attendance.findMany({
    where: { employeeId: req.user.employeeId },
    orderBy: { date: "desc" },
  });
  res.json(records);
});

// GET /api/attendance - admin views all attendance records
router.get("/", requireRole("ADMIN"), async (req, res) => {
  const records = await prisma.attendance.findMany({
    include: { employee: { select: { fullName: true } } },
    orderBy: { date: "desc" },
  });
  res.json(records);
});

// GET /api/attendance/:employeeId - admin views one employee's attendance
router.get("/:employeeId", requireRole("ADMIN"), async (req, res) => {
  const records = await prisma.attendance.findMany({
    where: { employeeId: Number(req.params.employeeId) },
    orderBy: { date: "desc" },
  });
  res.json(records);
});

module.exports = router;
