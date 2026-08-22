const { PrismaClient } = require("@prisma/client");

// Single shared instance - avoids exhausting DB connections in dev with hot reload
const prisma = new PrismaClient();

module.exports = prisma;
