# Phase 1: Requirements Planning

> **Instructions for the Author:** Use this section to outline the fundamental problem the NVSU Fines System solves. Define the boundaries of the system, list who will be using it, and describe your core objectives.

## 1. Project Background and Objective
*Briefly describe the current manual process for managing fines at NVSU. Explain why a Paperless/Digital System is necessary.*
* **Objective:** (e.g., To create a role-based, centralized, digital ecosystem for issuing, paying, and tracking student fines across NCSSC and college organizations.)

## 2. Key Stakeholders
*Identify everyone who relies on or manages this system.*
* **System Administrator:** Has full control, manages users/organizations, and oversees all system data.
* **Organizations (NCSSC / College Orgs / Sub Orgs):** Can issue fines to students and mark fines as paid/unpaid.
* **Students:** End-users who need a transparent view of their outstanding balances and historical fine records.

## 3. Project Scope
*What is INCLUDED in the system vs what is EXCLUDED?*
* **In Scope:** Authentication, Fine issuing, Dashboard Reporting, CSV Exports, Profile Editing with Admin Approvals.
* **Out of Scope:** (e.g., Automated third-party payment gateways like GCash integration—assuming payments are currently settled in cash/in-person).

## 4. Technical Stack Requirements
*List the core technologies chosen for rapid development.*
* **Frontend:** Next.js (React), TypeScript, CSS
* **Backend / Database:** Supabase (PostgreSQL), Authentication
* **Methodology:** Rapid Application Development (RAD)
