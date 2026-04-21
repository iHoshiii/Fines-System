# Phase 3: Construction

> **Instructions for the Author:** RAD emphasizes fast, iterative coding. Document the software development processes, the primary hurdles overcome, and the specific functional implementations finalized during the build.

## 1. Development Cycles (Sprints)
*Detail the sequential steps taken to build the application.*
* **Sprint 1: Authentication & Schema** - Setting up Supabase hooks, connecting Next.js, and ensuring secure logins.
* **Sprint 2: Dashboard Layouts** - Structuring the `<Sidebar />`, routing contexts, and role-based redirects.
* **Sprint 3: The Fines Engine** - Implementing the logic to add, edit, delete, and flag fines as paid/unpaid. Setting up the custom template system.
* **Sprint 4: Refinement & Validation** - Adding pagination (15 items/page), robust filtering by Org/College, and Admin approval queues for profile changes.

## 2. Codebase Organization
*Give developers an overview of the file tree.*
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
*Discuss how you ensured the system works before launch.*
* Role isolation checks (Testing if students can bypass and view admin data).
* Input validation (Enforcing numeric constraints on amounts, preventing empty descriptions).
* Responsiveness checks (Ensuring modals and tables scale accurately).
