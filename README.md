Voodo

Voodo is a basic Human Resource Management System (HRMS) designed to manage employee information, attendance, leave requests, payroll, and administrator operations through a simple web interface.

Features
Authentication
Employee signup and login
Admin login
Password hashing using bcrypt
Session-based authentication
Role-based access control
Employee ID validation
Protected admin and employee routes
Employee Management
Employee directory
Search employees by name, email, or employee ID
View employee details
Update employee information
Department and job title management
Salary information
Profile picture upload
Phone and address management
Attendance
Employee check-in and check-out
Employee attendance history
Admin attendance overview
Attendance status tracking
Leave Management
Apply for leave
Casual, Sick, Paid, and Unpaid leave
Start and end date selection
Leave reason/remarks
Pending, Approved, and Rejected statuses
Admin approval and rejection
Admin comments on leave requests
Employees can view admin comments and leave status
Payroll
Admin payroll management
Employee payroll viewing
Salary information
Basic payroll calculations
Administrator Management
Admin dashboard
View administrators
Create new administrator accounts
Department and job title assignment for administrators


Tech Stack
Node.js
Express.js
MongoDB
Mongoose
EJS
HTML
CSS
JavaScript
bcryptjs
Multer
express-session


Project Structure
Voodo-doll/
├── middleware/
├── models/
├── public/
│   ├── css/
│   └── uploads/
├── routes/
├── views/
│   ├── admin/
│   └── employee/
├── .env
├── .gitignore
├── create-admin.js
├── package.json
├── package-lock.json
├── server.js
└── README.md


Setup

1. Clone the repository
git clone <repository-url>
cd Voodo-doll

2. Install dependencies
npm install

3. Configure environment variables
Create a .env file in the project root.
MONGO_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret
PORT=3000

4. Create an administrator
Run:
node create-admin.js
Follow the prompts to create the initial administrator account.
Additional administrators can be created through the administrator management section after logging in.

5. Start the server
node server.js
The application will run on:
http://localhost:3000

User Roles
Employee

Employees can:

View their dashboard
Manage their profile
Upload a profile picture
View attendance
Check in and check out
Apply for leave
Track leave requests
View administrator comments
View payroll information
Administrator

Administrators can:

View the admin dashboard
Manage employees
Search employees
View employee details
View attendance records
Manage payroll
Review leave requests
Approve or reject leave
Add comments to leave requests
Create additional administrator accounts
Database

Voodo uses MongoDB for persistent storage.

Main collections include:

Users
Attendance
Leave
Payroll

Uploaded profile pictures are stored under:

public/uploads/

The upload directory is excluded from Git.

Security
Passwords are hashed using bcrypt
Authentication uses sessions
Admin routes are protected using role-based middleware
Employee and administrator accounts have separate access permissions
Environment variables are used for database credentials and session secrets
Future Enhancements
Email verification
Password reset
Employee document management
Advanced attendance statuses and reports
Notifications
Payroll reports
Analytics dashboard
Cloud-based profile picture and document storage