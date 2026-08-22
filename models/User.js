const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      unique: true,
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["employee", "admin"],
      default: "employee",
    },

    phone: String,
    address: String,
    department: String,
    jobTitle: String,

    salary: {
      type: Number,
      default: 0,
    },

    joiningDate: {
      type: Date,
      default: Date.now,
    },

    profilePicture: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);