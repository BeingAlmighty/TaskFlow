# TaskFlow - Enterprise Task Management System

TaskFlow is a highly specialized, secure, and intuitive web application designed to streamline operations, task delegation, and performance tracking across enterprise organizations. It offers dedicated portals for Administrators and Users, alongside a hidden operations portal for Super-Administrators, ensuring that the right tools are always in the right hands.

## Project Overview

Our core objective with TaskFlow is to replace fragmented workflows, scattered spreadsheets, and endless email chains with a centralized hub for productivity. TaskFlow allows organizations to:

- Create, assign, and monitor tasks in real-time.
- Track user performance via an automated points and leaderboard system.
- Manage user availability and operational capacity.
- Organize tasks and users by specific departments or functional categories.

## Technology Stack

TaskFlow is built on a modern, high-performance web architecture optimized for speed, scalability, and developer experience.

### Frontend Architecture
- **Next.js (App Router):** The foundation of our application, providing server-side rendering, static site generation, and seamless API integration.
- **React:** The underlying library powering our dynamic user interfaces.
- **Tailwind CSS:** A utility-first CSS framework that allows us to rapidly build custom, responsive designs without leaving our markup.
- **SWR:** A state-of-the-art data fetching library from Vercel that handles our client-side state management. It provides automatic background refetching, intelligent caching, request deduplication, and fast optimistic UI updates.
- **Framer Motion:** Utilized for subtle, professional micro-animations that enhance the user experience without feeling overwhelming.

### Backend & Database
- **Next.js Server Actions:** We utilize Next.js Server Actions to securely mutate data without requiring a standalone REST API layer.
- **PostgreSQL:** Our robust, relational database system that ensures data integrity and supports complex querying for analytics and dashboards.
- **Vercel Edge Network:** The application is optimized for deployment on Vercel, utilizing Edge Middleware for lightning-fast request interception.

## Security Architecture

Security is not an afterthought; it is built into the foundation of TaskFlow. We employ a defense-in-depth strategy to protect sensitive organizational data.

- **Edge-Level Verification:** We utilize `jose`, a lightweight cryptographic library, within our Next.js Edge Middleware. Every incoming request to protected routes is cryptographically verified at the edge network before it ever reaches our application logic. If a JSON Web Token (JWT) is invalid or tampered with, the request is instantly rejected and redirected.
- **Secure Token Storage:** Authentication state is maintained using HTTP-Only cookies. By ensuring cookies cannot be accessed via client-side JavaScript, we effectively neutralize Cross-Site Scripting (XSS) attacks aimed at stealing session tokens.
- **Password Cryptography:** User passwords are encrypted using `bcrypt` with heavy salt rounds. In the event of legacy users logging in with outdated plaintext passwords, the system silently and automatically upgrades their credentials to modern `bcrypt` hashes upon successful authentication.
- **Role-Based Access Control (RBAC):** The system enforces strict boundaries between standard users, organizational administrators, and system super-administrators. Routes, API actions, and database queries all verify the requester's role before proceeding.

## Workflow and State Management

TaskFlow is designed to feel instantaneous to the end-user while maintaining absolute truth with the database.

- **Intelligent Caching:** By utilizing SWR, when an administrator navigates away from the dashboard and returns, the interface loads instantly from the browser's local cache. Meanwhile, SWR quietly pings the server in the background to ensure no new data has been missed, updating the UI seamlessly if changes occurred.
- **Real-Time Cross-Tab Synchronization:** If a user logs out in one browser tab, our AuthProvider instantly broadcasts that state change across all other open tabs, securing the session application-wide.
- **Automated Validation:** Tasks submitted for review are temporarily locked, requiring administrator approval. Administrators can choose to award standard points, allocate bonus points for exceptional work, or end tasks without points if they do not meet quality standards.

## Getting Started

To run the TaskFlow environment locally for development or testing:

1. Clone the repository and navigate into the `react` directory.
2. Install the required dependencies:
   ```bash
   npm install
   ```
3. Configure your environment variables. Ensure you have a valid PostgreSQL connection string and a secure `JWT_SECRET`.
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Navigate to `http://localhost:3000` in your browser. The default landing page will direct you to `/login` to access the portals.

---

TaskFlow represents the intersection of clean design, rigorous security, and uncompromising performance. We are continuously iterating on this foundation to provide the best possible management experience.
