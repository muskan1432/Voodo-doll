const express = require("express");
const prisma = require("../prismaClient");
const { verifyToken, requireRole } = require("../middleware/auth.middleware");

const router = express.Router();
router.use(verifyToken);

// POST /api/leave - employee applies for leave
router.post("/", async (req, res) => {
  const { leaveType, startDate, endDate, remarks } = req.body;

  if (!leaveType || !startDate || !endDate) {
    return res.status(400).json({ error: "leaveType, startDate, and endDate are required" });
  }

  const request = await prisma.leaveRequest.create({
    data: {
      employeeId: req.user.employeeId,
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      remarks,
      status: "PENDING",
    },
  });

  res.status(201).json(request);
});

// GET /api/leave/me - employee views their own leave requests
router.get("/me", async (req, res) => {
  const requests = await prisma.leaveRequest.findMany({
    where: { employeeId: req.user.employeeId },
    orderBy: { createdAt: "desc" },
  });
  res.json(requests);
});

// GET /api/leave - admin views all leave requests
router.get("/", requireRole("ADMIN"), async (req, res) => {
  const requests = await prisma.leaveRequest.findMany({
    include: { employee: { select: { fullName: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(requests);
});

// PUT /api/leave/:id/status - admin approves or rejects a request
router.put("/:id/status", requireRole("ADMIN"), async (req, res) => {
  const { status, reviewComments } = req.body;

  if (!["APPROVED", "REJECTED"].includes(status)) {
    return res.status(400).json({ error: "status must be APPROVED or REJECTED" });
  }

  const updated = await prisma.leaveRequest.update({
    where: { id: Number(req.params.id) },
    data: {
      status,
      reviewComments,
      reviewedByAdminId: req.user.id,
    },
  });

  res.json(updated);
});

module.exports = router;
