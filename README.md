# Personal Finance Advisor

A household budget management and financial advisory application. Track incomes, expenses, and get personalized financial guidance based on your financial health.

## Features

**Phase 1 (Current):**
- 🔐 Multi-provider authentication (Email, Google, Facebook)
- 🏠 Household management with member permissions (read/write)
- 💰 Budget tracking (incomes & expenses)
- 📊 Category-based organization
- 📅 Time granularity (monthly, quarterly, yearly)

**Upcoming Phases:**
- Financial advisor with ranking and personalized advice
- Investment data integration
- Dashboard visualizations
- Mobile app (React Native)

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Real-time)
- **Deployment:** Vercel
- **CI/CD:** GitHub Actions

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- GitHub account
- Vercel account (for deployment)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/personal-finance-advisor.git
cd personal-finance-advisor
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (for admin operations)

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Development Workflow

This project uses a feature-branch workflow with PRs:

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make changes and commit: `git commit -m "feat: your feature description"`
3. Push to GitHub: `git push origin feature/your-feature-name`
4. Create a Pull Request on GitHub
5. CI runs automatically (lint, type-check, build)
6. Merge to `main` → auto-deploys to Vercel

## Project Structure

```
├── app/                  # Next.js App Router
│   ├── (auth)/          # Auth-related pages
│   ├── (dashboard)/     # Protected dashboard pages
│   ├── api/             # API routes
│   └── layout.tsx       # Root layout
├── components/          # Reusable React components
├── lib/                 # Utilities and configurations
│   ├── supabase/        # Supabase client setup
│   └── utils/           # Helper functions
├── public/              # Static assets
└── types/               # TypeScript type definitions
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler check

## Contributing

This is a personal project, but feedback is welcome! Feel free to open issues or submit PRs.

## License

MIT

---

Built with ❤️ using Next.js, Supabase, and TypeScript
