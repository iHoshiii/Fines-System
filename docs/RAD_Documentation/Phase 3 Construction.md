# Phase 3: Construction

## 1. Development Cycles (Sprints)
**Sprint 1: Authentication & Schema** 
 Setting up Supabase hooks, connecting Next.js, and ensuring secure logins.

**Sprint 2: Dashboard Layouts** 
 Structuring the UI/UX (`<Sidebar />`), routing contexts, and role-based redirects.

**Sprint 3: The Fines Engine** 
 Implementing the logic to add, edit, delete, and flag fines as paid/unpaid. Setting up the custom template system.

**Sprint 4: Refinement & Validation** 
 Adding additional features and logics such as pagination (15 items/page), robust filtering by Org/College, and Admin approval queues for profile changes.

## 2. Codebase Organization
```text
/frontend/src/
  ├── app/                  # Next.js App Router mapping
  │   └── dashboard/        # Role-based secure routes
  ├── components/           # Reusable UI (Sidebar, Modals, Skeletal Loaders)
  ├── context/              # Global state (AuthContext, DataContext)
  ├── lib/                  # Utilities (Supabase client initializers)
  └── types/                # Strict TypeScript interfaces
```

## 3. Testing and Quality Assurance
Role isolation checks (Testing if students can bypass and view admin data).

Input validation (Enforcing numeric constraints on amounts, preventing empty descriptions).

Responsiveness checks (Ensuring modals and tables scale accurately).

Admin Reports and Analytics (Downloadable CSV files in excel format)
