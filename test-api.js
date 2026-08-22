// Automated API test for Dayflow HRMS backend.
// Run with: node test-api.js   (server must already be running via npm run dev)
// Uses Node's built-in fetch (Node 18+).

const BASE = "http://localhost:5000";
let pass = 0;
let fail = 0;

function log(name, ok, detail) {
  if (ok) {
    pass++;
    console.log(`✅ ${name}`);
  } else {
    fail++;
    console.log(`❌ ${name} -> ${detail}`);
  }
}

async function call(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // non-JSON response, leave data null
  }

  return { status: res.status, data };
}

async function main() {
  const suffix = Date.now(); // avoids collisions if you run this script multiple times
  const empEmail = `employee${suffix}@test.com`;
  const admEmail = `admin${suffix}@test.com`;

  // --- Health check ---
  {
    const r = await call("GET", "/api/health");
    log("Health check", r.status === 200 && r.data?.status === "ok", `status ${r.status}`);
  }

  // --- Signup ---
  const empSignup = await call("POST", "/api/auth/signup", {
    employeeCode: `EMP${suffix}`,
    email: empEmail,
    password: "test1234",
    fullName: "Test Employee",
  });
  log("Signup employee", empSignup.status === 201, JSON.stringify(empSignup.data));

  const admSignup = await call("POST", "/api/auth/signup", {
    employeeCode: `ADM${suffix}`,
    email: admEmail,
    password: "test1234",
    fullName: "Test Admin",
    role: "ADMIN",
  });
  log("Signup admin", admSignup.status === 201, JSON.stringify(admSignup.data));

  // --- Login ---
  const empLogin = await call("POST", "/api/auth/login", { email: empEmail, password: "test1234" });
  log("Login employee", empLogin.status === 200 && !!empLogin.data?.token, JSON.stringify(empLogin.data));
  const empToken = empLogin.data?.token;
  const employeeId = empLogin.data?.user?.employeeId;

  const admLogin = await call("POST", "/api/auth/login", { email: admEmail, password: "test1234" });
  log("Login admin", admLogin.status === 200 && !!admLogin.data?.token, JSON.stringify(admLogin.data));
  const admToken = admLogin.data?.token;

  if (!empToken || !admToken) {
    console.log("\nStopping early — login failed, can't test protected routes.");
    printSummary();
    return;
  }

  // --- Employee profile ---
  {
    const r = await call("GET", "/api/employees/me", null, empToken);
    log("GET /employees/me (self)", r.status === 200, JSON.stringify(r.data));
  }
  {
    const r = await call("PUT", "/api/employees/me", { phone: "9999999999", address: "Bangalore" }, empToken);
    log("PUT /employees/me (self, allowed fields)", r.status === 200 && r.data?.phone === "9999999999", JSON.stringify(r.data));
  }

  // --- Attendance ---
  {
    const r = await call("POST", "/api/attendance/checkin", null, empToken);
    log("POST /attendance/checkin", r.status === 201, JSON.stringify(r.data));
  }
  {
    const r = await call("POST", "/api/attendance/checkin", null, empToken);
    log("POST /attendance/checkin again -> expect 409", r.status === 409, JSON.stringify(r.data));
  }
  {
    const r = await call("POST", "/api/attendance/checkout", null, empToken);
    log("POST /attendance/checkout", r.status === 200 && !!r.data?.checkOut, JSON.stringify(r.data));
  }
  {
    const r = await call("GET", "/api/attendance/me", null, empToken);
    log("GET /attendance/me", r.status === 200 && Array.isArray(r.data) && r.data.length > 0, JSON.stringify(r.data));
  }

  // --- Leave ---
  let leaveId;
  {
    const r = await call(
      "POST",
      "/api/leave",
      { leaveType: "SICK", startDate: "2026-08-25", endDate: "2026-08-26", remarks: "Fever" },
      empToken
    );
    log("POST /leave (apply)", r.status === 201 && r.data?.status === "PENDING", JSON.stringify(r.data));
    leaveId = r.data?.id;
  }
  {
    const r = await call("GET", "/api/leave/me", null, empToken);
    log("GET /leave/me", r.status === 200 && Array.isArray(r.data), JSON.stringify(r.data));
  }
  {
    const r = await call("GET", "/api/leave", null, admToken);
    log("GET /leave (admin, all)", r.status === 200 && Array.isArray(r.data), JSON.stringify(r.data));
  }
  if (leaveId) {
    const r = await call(
      "PUT",
      `/api/leave/${leaveId}/status`,
      { status: "APPROVED", reviewComments: "Get well soon" },
      admToken
    );
    log("PUT /leave/:id/status (admin approve)", r.status === 200 && r.data?.status === "APPROVED", JSON.stringify(r.data));
  }

  // --- Payroll ---
  if (employeeId) {
    const r = await call(
      "POST",
      `/api/payroll/${employeeId}`,
      { basic: 30000, hra: 10000, allowances: 2000, deductions: 500, effectiveFrom: "2026-08-01" },
      admToken
    );
    log("POST /payroll/:employeeId (admin adds)", r.status === 201 && Number(r.data?.netSalary) === 41500, JSON.stringify(r.data));
  }
  {
    const r = await call("GET", "/api/payroll/me", null, empToken);
    log("GET /payroll/me (employee, read-only)", r.status === 200, JSON.stringify(r.data));
  }
  if (employeeId) {
    const r = await call("GET", `/api/payroll/${employeeId}`, null, admToken);
    log("GET /payroll/:employeeId (admin history)", r.status === 200 && Array.isArray(r.data), JSON.stringify(r.data));
  }

  // --- Admin-only listing routes ---
  {
    const r = await call("GET", "/api/employees", null, admToken);
    log("GET /employees (admin, list all)", r.status === 200 && Array.isArray(r.data), JSON.stringify(r.data));
  }
  {
    const r = await call("GET", "/api/attendance", null, admToken);
    log("GET /attendance (admin, all)", r.status === 200 && Array.isArray(r.data), JSON.stringify(r.data));
  }

  // --- Role-gating: employee should be blocked from admin routes ---
  {
    const r = await call("GET", "/api/employees", null, empToken);
    log("GET /employees as EMPLOYEE -> expect 403", r.status === 403, JSON.stringify(r.data));
  }
  {
    const r = await call("GET", "/api/leave", null, empToken);
    log("GET /leave as EMPLOYEE -> expect 403", r.status === 403, JSON.stringify(r.data));
  }

  printSummary();
}

function printSummary() {
  console.log(`\n${"-".repeat(40)}`);
  console.log(`Passed: ${pass}  Failed: ${fail}`);
  console.log(fail === 0 ? "All routes working ✅" : "Some routes need attention ⚠️");
}

main().catch((err) => {
  console.error("Test script crashed:", err);
});
