const mongoose = require("mongoose");

const salarySchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    basicSalary: {
      type: Number,
      default: 0,
    },

    allowances: {
      type: Number,
      default: 0,
    },

    deductions: {
      type: Number,
      default: 0,
    },

    netSalary: {
      type: Number,
      default: 0,
    },

    month: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Processed"],
      default: "Processed",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Salary", salarySchema);