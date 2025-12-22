# ERP System

A modern, full-featured Enterprise Resource Planning (ERP) system built with Next.js 16, designed for small to medium businesses. Features multi-tenant architecture, beautiful dark mode UI, and modular design allowing organizations to enable only the features they need.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwindcss)

---

## ✨ Features

### Multi-Tenant Architecture
- Organization-based isolation using Clerk
- Role-based access control
- Customizable module selection per organization

### 11 Core Modules

| Module | Description |
|--------|-------------|
| **💰 Finance** | Chart of accounts, invoices, bills, payments, budgets |
| **👥 CRM** | Customers, vendors, leads, opportunities, activities |
| **🛒 Sales** | Sales orders, shipments, delivery tracking |
| **📦 Inventory** | Products, warehouses, stock levels, reorder alerts |
| **🛍️ Procurement** | Purchase orders, goods receipts |
| **👤 HR** | Employees, leave management, timesheets, payroll |
| **💾 Assets** | Fixed asset tracking and depreciation |
| **📁 Projects** | Project management with tasks and milestones |
| **📄 Documents** | Document storage and management |
| **🏭 Manufacturing** | Bill of materials, work orders |
| **🏪 E-Commerce** | Online stores with multiple payment providers |

### Additional Features
- **Audit Logging** - Track all changes with full audit trail
- **Public Feedback Board** - Collect user feedback with voting
- **Product Roadmap** - Show planned features to users
- **Email Notifications** - Status change notifications via Resend

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router & Turbopack
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **Authentication**: [Clerk](https://clerk.com/) (multi-tenant orgs)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Validation**: [Zod](https://zod.dev/)
- **Email**: [Resend](https://resend.com/)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (or [Neon](https://neon.tech/) for serverless)
- Clerk account for authentication
- (Optional) Resend account for email notifications

### 1. Clone & Install

```bash
git clone <repository-url>
cd erp
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Database (Required)
DATABASE_URL="postgresql://user:password@host:5432/database"

# Clerk Authentication (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"

# App URL (Required)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Email - Resend (Optional - for notifications)
RESEND_API_KEY="re_..."
FROM_EMAIL="noreply@yourdomain.com"
COMPANY_NAME="Your Company Name"

# Admin Email (Optional - receives order notifications)
ADMIN_EMAIL="admin@yourdomain.com"
```

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk public key |
| `CLERK_SECRET_KEY` | ✅ | Clerk secret key |
| `NEXT_PUBLIC_APP_URL` | ✅ | Full URL of your app |
| `RESEND_API_KEY` | ❌ | For email notifications |
| `FROM_EMAIL` | ❌ | Sender email for notifications |
| `COMPANY_NAME` | ❌ | Company name in emails |
| `ADMIN_EMAIL` | ❌ | Receives e-commerce order alerts |

### 3. Database Setup

```bash
# Push schema to database
npm run db:push

# Generate Prisma client
npm run db:generate

# (Optional) Open Prisma Studio
npm run db:studio
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/           # Sign-in/Sign-up pages
│   ├── (dashboard)/      # Main dashboard layout
│   │   └── dashboard/
│   │       ├── finance/  # Finance module pages
│   │       ├── crm/      # CRM module pages
│   │       ├── sales/    # Sales module pages
│   │       ├── inventory/# Inventory module pages
│   │       ├── ...       # Other modules
│   │       └── page.tsx  # Dashboard home
│   ├── actions/          # Server actions (24 files)
│   ├── api/              # API routes
│   ├── feedback/         # Public feedback board
│   ├── onboarding/       # Module selection
│   ├── roadmap/          # Public roadmap
│   └── store/            # E-commerce storefront
├── components/
│   ├── shared/           # Sidebar, Header, ModuleNav
│   ├── finance/          # Finance components
│   ├── crm/              # CRM components
│   ├── sales/            # Sales components
│   ├── inventory/        # Inventory components
│   └── ...               # Other module components
├── lib/
│   ├── prisma.ts         # Prisma client
│   ├── auth.ts           # Auth utilities
│   ├── audit.ts          # Audit logging
│   ├── email.ts          # Email utilities
│   └── utils.ts          # Helper functions
└── prisma/
    └── schema.prisma     # Database schema (1600+ lines)
```

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema changes to database |
| `npm run db:studio` | Open Prisma Studio GUI |

---

## 🔐 Authentication Flow

1. **Sign Up** → User creates account via Clerk
2. **Organization** → User creates/joins an organization
3. **Onboarding** → Admin selects which modules to enable
4. **Dashboard** → Access granted with filtered sidebar

---

## 🎨 Module Selection

Organizations can choose which modules to enable during onboarding:

- **Default modules**: Finance, CRM, Sales, Inventory
- **Optional modules**: Procurement, HR, Assets, Projects, Documents, Manufacturing, E-Commerce
- **Always visible**: Dashboard, Reports, Settings

Module preferences are stored at the organization level, so all team members see the same modules.

---

## 🌐 E-Commerce Storefront

Each organization can create online stores with:
- Customizable branding (logo, colors)
- Product catalog from inventory
- Multiple payment providers:
  - Cash on Delivery (COD)
  - Stripe
  - Flutterwave
  - LemonSqueezy

Public storefronts are accessible at `/store/[slug]`

---

## 📧 Email Notifications

The system sends email notifications for:
- Feedback status changes
- (Extensible for invoices, orders, etc.)

Configure Resend API key in `.env` to enable emails.

---

## 🗄️ Database Schema

The Prisma schema includes 40+ models covering:

- **Core**: Organization, AuditLog
- **Finance**: Account, Transaction, Invoice, Bill, Payment, Budget
- **CRM**: Customer, Vendor, Contact, Lead, Opportunity, Activity
- **Sales**: SalesOrder, Delivery, Return
- **Inventory**: Product, Warehouse, StockLevel, StockMovement
- **Procurement**: PurchaseOrder, GoodsReceipt
- **HR**: Employee, LeaveRequest, Timesheet, PayrollRecord
- **Assets**: Asset, AssetMaintenance
- **Projects**: Project, ProjectTask, ProjectMilestone
- **Documents**: Document
- **Manufacturing**: BillOfMaterials, WorkOrder
- **E-Commerce**: OnlineStore, StoreProduct, StoreOrder
- **Feedback**: Feedback, FeedbackVote, FeedbackReply

---

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Docker

```dockerfile
# Coming soon
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📞 Support

- **Issues**: Open a GitHub issue
- **Discussions**: Use GitHub Discussions
- **Feedback**: Use the in-app feedback board at `/feedback`
