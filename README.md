# Team Workload & Task Tracking System

A full-stack web application for managing team tasks and monitoring member workload. Built with ASP.NET Core and React, the system goes beyond simple task counting by calculating a **weight** for each task based on effort, complexity, and priority so it gives the team leaders a view of who is overloaded and who has capacity.

---

## Tech Stack

**Backend**
- ASP.NET Core — REST API
- Entity Framework Core — Code First with Migrations
- ASP.NET Identity — User management and authentication
- JWT — Stateless authentication
- PostgreSQL

**Frontend**
- React (Vite)

---

## Features

### Authentication & Authorization
- JWT-based login with role-protected routes
- Three roles: **Admin**, **Team Leader**, **Member**
- Sidebar navigation dynamically changes per role

### Admin
- Create and manage users (name, email, password, role, team)
- Create, rename, and delete teams
- Reassign members between teams
- Send email invitations with role and team assignment
- View and cancel pending invitations

### Team Leader / Admin
- Create, edit, and delete tasks with full field set
- View all tasks with search and filter by status and priority
- Approve or reject member change requests
- View full change request history
- Access workload dashboard with per-member breakdown
- Drill into any member's tasks via slide-out panel
- Access calendar showing all team tasks by start and due date

### Member
- View own assigned tasks
- Acknowledge tasks to confirm awareness
- Update task status
- Submit change requests for restricted changes (owner, due date, effort, priority, status)
- View status of submitted change requests
- Access calendar scoped to own tasks

---

## Getting Started

### Backend Setup

1. Clone the repository
```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name/backend
```

2. Update the connection string in `appsettings.json`
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=YOUR_SERVER;Database=TeamWorkloadDb;Trusted_Connection=True;TrustServerCertificate=True"
}
```

3. Apply migrations
```bash
dotnet ef database update
```

4. Run the API
```bash
dotnet run
```

---

### Frontend Setup

1. Navigate to the frontend folder
```bash
cd ../frontend
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file
```env
VITE_API_URL=https://localhost:5001
```

4. Start the development server
```bash
npm run dev
```

## License

This project is for academic purposes.
