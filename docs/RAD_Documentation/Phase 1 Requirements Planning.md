# Phase 1: Requirements Planning

> **Instructions for the Author:**
One of the main problem of Nueva Vizcaya State University is the management of fines. It is currently being done manually, which is inefficient and prone to errors. This system aims to solve this problem by providing a centralized, digital ecosystem for issuing, paying, and tracking student fines across NCSSC and college organizations.

## 1. Project Background and Objective
Student fines are manually typed in Excel files, which are then printed and distributed to students. This process is time-consuming and hustle especially the paying of fines is scheduled during signing of clearance. 

* **Objective:** 
To create a role-based, centralized, digital ecosystem for issuing, paying, and tracking student fines across NVSU's organizations.

## 2. Key Stakeholders
**System Administrator:**
 Has the full control. Manages users/organizations, sees reports, edit basic information of users and oversees all system data.

**Organizations (NCSSC / College Orgs / Sub Orgs):** 
 Can issue fines to students and mark fines as paid/unpaid.
**Students:** 

 End-users who need a transparent view of their outstanding balances and historical fine records.

## 3. Project Scope
**In Scope:** Authentication, Fine issuing, Dashboard Reporting, CSV/Reports Exportation, Profile Editing with Admin Approvals.

**Out of Scope:** 
Automated third-party payment gateways like GCash assuming payments are currently settled in cash/in-person.
 
## 4. Technical Stack Requirements
* **Frontend:**
 Next.js (React), TypeScript, CSS

* **Backend / Database:**
 Supabase (PostgreSQL), Authentication (Auth0)
 
* **Methodology:**
 Rapid Application Development (RAD)
