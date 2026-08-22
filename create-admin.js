require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existingAdmin = await User.findOne({
      email: process.env.ADMIN_EMAIL,
    });

    if (existingAdmin) {
      console.log("An account with this email already exists.");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash(
      process.env.ADMIN_PASSWORD,
      10
    );

    await User.create({
      employeeId: "ADMIN001",
      name: process.env.ADMIN_NAME || "Voodo Administrator",
      email: process.env.ADMIN_EMAIL,
      password: hashedPassword,
      role: "admin",
      department: "Administration",
      jobTitle: "HR Administrator",
    });

    console.log("Admin account created successfully.");
    console.log(`Email: ${process.env.ADMIN_EMAIL}`);

    process.exit();
  } catch (error) {
    console.error("Failed to create admin:", error.message);
    process.exit(1);
  }
}

createAdmin();