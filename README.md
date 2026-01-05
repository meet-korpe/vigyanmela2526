## Vigyan Mela 2025–26

Vigyan Mela is the annual flagship tech showcase of the BSc IT Department at Chetana College, celebrating student-led innovation across software, IoT, and emerging tech. The 2025 edition (Vigyan Mela 4.0) runs 11–12 Dec 2025 at Chetana College, Bandra (E), Mumbai, with free visitor passes and project registrations available online. The site blends an interactive Spline-powered landing page with ticketing, project intake, and admin workflows.

- Live site: https://vigyanmela.chetanacollege.in
- Tagline: Where Science Meets Innovation

### Highlights
- Visitor e-passes with shareable tickets and LinkedIn/Twitter promotion.
- Project/college registrations with Cloudinary-backed uploads.
- LinkedIn OAuth plus email/password sign-in for controlled access.
- Admin tools for reviewers, event heads, students, visitors, and site settings.
- Rich storytelling: 3D hero, interactive timeline, and photo gallery.

### Tech Stack
- Next.js 16 (App Router, React 19) with TypeScript.
- Tailwind CSS 4 and custom UI components (parallax, hover gradients, tooltips).
- MongoDB via Mongoose for all persistence.
- NextAuth (LinkedIn + credentials) for authentication.
- Cloudinary for media uploads; Resend for transactional mail.
- GSAP/Motion/Spline for interactive hero and animations.

## Getting Started
Prerequisites: Node.js 18.18+ and npm (or pnpm/bun/yarn).

1) Install dependencies
```bash
npm install
```

2) Create `.env.local` with the required secrets (see next section).

3) Run the dev server
```bash
npm run dev
```
Visit http://localhost:3000.

## Environment Variables
Create `.env.local` in the project root.

| Name | Required | Description |
| --- | --- | --- |
| MONGODB_URI | Yes | MongoDB connection string. |
| NEXTAUTH_SECRET | Yes (prod) | Secret for NextAuth session signing. Generate with `openssl rand -hex 32`. |
| JWT_SECRET | Yes | Secret for admin token flows. |
| NEXT_PUBLIC_SITE_URL | Yes | Public site origin (e.g., https://vigyanmela.chetanacollege.in). |
| LINKEDIN_CLIENT_ID | Yes | LinkedIn OAuth app client ID for visitor login/sharing. |
| LINKEDIN_CLIENT_SECRET | Yes | LinkedIn OAuth app client secret. |
| CLOUDINARY_CLOUD_NAME | Yes | Cloudinary cloud name for uploads. |
| CLOUDINARY_API_KEY | Yes | Cloudinary API key. |
| CLOUDINARY_API_SECRET | Yes | Cloudinary API secret. |
| RESEND_API_KEY | Optional | Enables email delivery for tickets/password resets. |
| RESEND_FROM | Optional | From address for Resend (e.g., xyz@example.com). |

## Project Structure (high level)
- app/ – App Router pages and API routes (registration, auth, admin, uploads).
- components/ – UI and feature modules (registration forms, admin dashboards, gallery, timeline, 3D hero, tooltips).
- dbconfig/ – MongoDB connection helper.
- models/ – Mongoose schemas (registrations, visitors, reviews, site settings, etc.).
- lib/ – Auth utilities, LinkedIn share helpers, general utils.

Key user-facing routes: `/` (3D landing), `/registration` (visitor pass), `/college-registration` (project intake), `/about` (story, timeline, gallery), `/eventheads/login` (admin access).

## Scripts
- `npm run dev` – Start local dev server.
- `npm run build` – Production build.
- `npm run start` – Run built app.
- `npm run lint` – Lint with ESLint.

## Deployment Notes
- Next.js 16 targets Node 18.18+; ensure the runtime matches.
- Configure environment variables in the hosting provider (Vercel/Node server) before deploying.
- Set `NEXT_PUBLIC_SITE_URL` to the live origin so auth callbacks and ticket links render correctly.

## Contributing / Maintenance
- Keep secrets out of version control; use `.env.local` for local dev.
- When adding new API routes, reuse the shared Mongo connection helper in dbconfig/.
- For new UI sections, prefer existing Tailwind tokens/components to maintain styling consistency.
