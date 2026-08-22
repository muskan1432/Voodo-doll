require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const authRoutes = require("./routes/auth");
const employeeRoutes = require("./routes/employee");
const attendanceRoutes = require("./routes/attendance");
const leaveRoutes = require("./routes/leave");
const adminRoutes = require("./routes/admin");
const payrollRoutes = require("./routes/payroll");

const app = express();

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use("/", authRoutes);
app.use("/employee", employeeRoutes);
app.use("/employee/attendance", attendanceRoutes);
app.use("/employee/leave", leaveRoutes);
app.use("/admin", adminRoutes);
app.use("/employee/payroll", payrollRoutes);
app.use("/payroll", payrollRoutes);

app.get("/", (req, res) => {
  res.redirect("/login");
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");

    app.listen(process.env.PORT || 3000, () => {
      console.log(
        `Server running on http://localhost:${process.env.PORT || 3000}`
      );
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
  });