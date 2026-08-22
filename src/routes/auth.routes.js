const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../prismaClient");

const router = express.Router();

// POST /api/auth/signup
// Creates a User + linked Employee profile in one go.
router.post("/signup", async (req, res) => {
  try {
    const { employeeCode, email, password, role, fullName } = req.body;

    if (!employeeCode || !email || !password || !fullName) {
      return res.status(400).json({ error: "employeeCode, email, password, and fullName are required" });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { employeeCode }] },
    });
    if (existing) {
      return res.status(409).json({ error: "A user with this email or employee code already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        employeeCode,
        email,
        passwordHash,
        role: role === "ADMIN" ? "ADMIN" : "EMPLOYEE", // default to EMPLOYEE unless explicitly ADMIN
        employee: {
          create: { fullName },
        },
      },
      include: { employee: true },
    });

    res.status(201).json({
      message: "Signup successful",
      user: { id: user.id, email: user.email, role: user.role, employeeId: user.employee.id },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Signup failed" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { employee: true },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, employeeId: user.employee?.id ?? null },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role, employeeId: user.employee?.id ?? null },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

module.exports = router;
