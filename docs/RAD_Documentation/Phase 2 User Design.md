# Phase 2: User Design

## 1. UI/UX Prototypes & Layouts
**Admin Dashboard:**
 Manages users/organizations, sees reports, edit basic information of users and oversees all system data.

**Student Dashboard:**
 Simplified, read-only interface showing Total Fines, Balances, and transparency of fines.

**Global Components:**
 Sidebar routing, Tabbed settings, Responsive modals.

## 2. Database Architecture (Supabase)
**`profiles`:**
 Stores ID, Role (student, admin, org), Full Name, Course, Year, Section, Email.

**`fines`:**
 Core transactional table. Stores Amount, Description, Status (paid/unpaid), Issued By, and Student ID.

**`organizations`:**
 Used to track structured organizational units and hierarchy.

## 3. Data Flow & Security
**Row Level Security (RLS) policies within Supabase.**

**Context wrappers (`AuthContext.tsx` and `DataContext.tsx`) ensuring components only fetch authorized data.**

Admin Approval Queue: Students can alter their profiles, but Name and ID edits go to a `pending_` column until verified.