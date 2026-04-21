# Phase 2: User Design

> **Instructions for the Author:** In RAD, the User Design phase focuses heavily on prototyping and architectural modeling. Put details here about how the user interfaces were designed and how the database tables are structured to support the features.

## 1. UI/UX Prototypes & Layouts
*Describe the interface goals. Ensure the NVSU "Premium Edge"/Green aesthetic is highlighted here.*
* **Admin Dashboard:** Focused on system-wide metrics, comprehensive data tables, CSV exports, and organization tracking.
* **Student Dashboard:** Simplified, read-only interface emphasizing Total Fines, Balances, and historical transparency.
* **Global Components:** Sidebar routing, Tabbed settings, Responsive modals.

## 2. Database Architecture (Supabase)
*Detail the core tables shaping the application.*
* **`profiles`:** Stores ID, Role (student, admin, org), Full Name, Course, Email.
* **`fines`:** Core transactional table. Stores Amount, Description, Status (paid/unpaid), Issued By, and Student ID.
* **`organizations`:** Used to track structured organizational units and hierarchy.

## 3. Data Flow & Security
*How is data secured and restricted?*
* Row Level Security (RLS) policies within Supabase.
* Context wrappers (`AuthContext.tsx` and `DataContext.tsx`) ensuring components only fetch authorized data.
* Admin Approval Queue: Students can alter their profiles, but Name and ID edits go to a `pending_` column until verified.
