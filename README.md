# Optometry Concierge

Optometry Concierge is a modern, real-time career concierge and job placement platform designed specifically for the Optometry community. Moving beyond the traditional "job board" model, it connects pre-vetted Doctors of Optometry (ODs) with independent practices and high-quality groups through a personalized, consent-based matching process.

## 🚀 Features

### 👤 User Roles & Auth
- **Provider (OD)**: Create a comprehensive career profile, upload resumes, and receive personalized job matching services with a focus on confidentiality.
- **Client (Employer)**: Post practice details and hiring needs to access a curated pipeline of interview-ready ODs.
- **Super Admin**: Centralized dashboard to monitor platform health, moderate intake responses, manage users, and facilitate candidate-employer matches.
- **Secure Authentication**: Built using Supabase Auth with automatic profile synchronization and custom role-based access control (RBAC).

### 💼 Concierge Matching Model
- **Confidential Profiles**: Candidate identities remain hidden until explicit consent is given for a specific introduction.
- **Guided Onboarding**: Multi-step intake forms for both ODs and Employers to capture professional goals and practice culture.
- **Real-Time Dashboards**: Personalized roadmaps for users to track their "Concierge Journey" (from profile creation to final hire).
- **Profile Integrity**: Automatic detection of deleted professional details with guidance for users to recreate them if necessary.

### 🛡️ Administrative Control Panel
- **Intake Moderation**: Full overview and management of all OD career profiles and Employer practice requests.
- **Concierge Matching**: Tools to link pre-vetted candidates to specific practice needs and track the introduction workflow.
- **User Management**: Activate, suspend, or permanently delete platform users with complete data cleanup cascades.
- **Platform Analytics**: High-level metrics for user growth, intake volume, and successful matches.

### ⚡ Real-Time Data Synchronization
- **Supabase Realtime**: All admin boards and user dashboards update instantly as records are modified.
- **Instant Role Enforcement**: Administrative changes to user roles reflect immediately without requiring a manual refresh.
- **Data Lifecycle Management**: Safeguards to ensure professional data is synchronized or purged during role changes and account deletions.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS 4
- **Routing & State**: TanStack Router (File-based), TanStack Query (React Query)
- **Database & Auth**: Supabase (PostgreSQL, Realtime, Row Level Security)
- **Icons & Notifications**: Lucide React, Sonner
- **Forms**: React Hook Form, Zod (Schema Validation)

---

## 📦 Getting Started

### Prerequisites
- Node.js (v18 or newer)
- Supabase Account and Database Project

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd optometry-concierge
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   - Create a `.env` file in the root directory:
     ```bash
     VITE_SUPABASE_URL=your_supabase_project_url
     VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
     VITE_SITE_URL=http://localhost:5173
     ```

4. Start the Development Server:
   ```bash
   npm run dev
   ```

---

## 🔐 Security & RLS Policies
The platform enforces strict data privacy using PostgreSQL Row Level Security (RLS):
- **Confidentiality First**: Candidate and Employer intake details are secured and only visible to the owner and Super Admins.
- **Internal Hardening**: Sensitive logic and roles are encapsulated in an `internal` schema to prevent API exposure.
- **Suspension Lock**: Suspended users are restricted from performing any database operations.
- **Robust Cascades**: Every account deletion triggers a complete cleanup of professional details, matching history, and roles to ensure data integrity.
