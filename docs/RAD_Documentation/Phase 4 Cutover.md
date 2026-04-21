# Phase 4: Cutover & Implementation

> **Instructions for the Author:** The Cutover phase involves transferring the completed system into a live operational environment. Use this section to document deployment setups, user training strategies, and long-term maintenance plans.

## 1. Deployment Architecture
*Where does the application live in production?*
* **Frontend Web Server:** Vercel (or equivalent hosting platform specialized for Next.js).
* **Database Backend:** Live Supabase Project infrastructure. 
* *Note mapping of environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).*

## 2. Data Migration & Cutover Process
*How does old data move to the new system?*
* Initial import of existing `.csv` records (Student rosters, NCSSC lists) via Supabase Studio.
* Manual execution of `schema.sql` to initialize all custom tables (`profiles`, `fines`, `organizations`).

## 3. User Training & Documentation
*How do NVSU staff and students learn to use the system?*
* Provide short instructional manuals for **Admins** (how to approve a student's Name/ID change).
* Provide workflow examples for **Orgs** (how to filter, search, and batch-pay fines).
* Provide transparent guides for **Students** (how to check their Fines Summary overview).

## 4. Maintenance and Future Roadmap
*What comes next post-launch?*
* E.g., potential future integrations of automated payment APIs.
* Scheduled database backups.
