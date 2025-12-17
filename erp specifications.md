# ERP System - Complete Planning & Specifications Document

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Database Design Principles](#database-design-principles)
5. [Security & Compliance](#security--compliance)
6. [Multi-Tenant Strategy](#multi-tenant-strategy)
7. [Module Specifications](#module-specifications)
8. [Implementation Approach](#implementation-approach)
9. [Development Guidelines](#development-guidelines)

---

## Project Overview

### Product Description
A comprehensive multi-tenant SaaS ERP (Enterprise Resource Planning) system designed to manage all aspects of business operations including finance, HR, inventory, sales, procurement, and more.

### Business Model
- **Deployment**: Multi-tenant SaaS (shared database architecture)
- **Scalability Path**: Hybrid architecture supporting dedicated databases for enterprise customers when needed
- **Target Market**: Small to medium businesses initially, with enterprise scaling capability

### Key Objectives
1. Build a monolithic application for faster development and easier maintenance
2. Implement proper multi-tenant isolation from day one
3. Support enterprise customers with dedicated infrastructure when revenue justifies it
4. Ensure compliance-ready architecture (SOC 2, GDPR, ISO 27001)
5. Provide comprehensive audit trails and security controls

---

## Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context + Server State (no Redux initially)
- **UI Components**: shadcn/ui (optional, for rapid development)

### Backend
- **Framework**: Next.js 15 API Routes + Server Actions
- **Language**: TypeScript
- **Note**: No separate Express server - use Next.js native backend capabilities

### Database
- **Primary Database**: PostgreSQL
- **ORM**: Prisma
- **Rationale**: 
  - ACID compliance for financial transactions
  - Superior handling of complex queries
  - Better concurrency control (MVCC)
  - Advanced features: JSON support, full-text search

### Authentication & Authorization
- **Provider**: Clerk
- **Features Utilized**:
  - Organizations (multi-tenant support)
  - Role-Based Access Control (RBAC)
  - Multi-Factor Authentication (MFA)
  - User management dashboard

### Cloud Infrastructure
- **Provider**: AWS (recommended) or Azure
- **Database Hosting**: AWS RDS for PostgreSQL
- **Storage**: AWS S3 for file storage
- **Monitoring**: AWS CloudWatch

### Additional Tools
- **Caching**: Redis (for session management and caching)
- **Monitoring**: Sentry (error tracking)
- **CI/CD**: GitHub Actions
- **Containerization**: Docker (optional for later scaling)

---

## Architecture

### Architectural Pattern
**Monolithic Architecture** with modular design

#### Why Monolithic?
- Faster initial development
- Easier debugging and testing
- Simpler deployment (one application)
- Better for small-to-medium teams
- All code in one repository
- Shared database ensures ACID transactions across modules

#### Modular Organization
Despite being monolithic, the codebase should be organized by business modules:

```
app/
├── (auth)/
│   ├── sign-in/
│   └── sign-up/
├── dashboard/
├── finance/
│   ├── accounts/
│   ├── invoices/
│   ├── reports/
│   └── layout.tsx
├── hr/
│   ├── employees/
│   ├── payroll/
│   └── layout.tsx
├── inventory/
│   ├── items/
│   ├── warehouses/
│   └── layout.tsx
├── sales/
├── procurement/
├── api/
│   ├── finance/
│   ├── hr/
│   └── inventory/
├── components/
│   ├── finance/
│   ├── hr/
│   └── shared/
└── lib/
    ├── prisma.ts
    ├── auth.ts
    └── utils.ts
```

---

## Database Design Principles

### Multi-Tenant Data Isolation

#### Core Principle
Every table containing tenant-specific data MUST include an `organizationId` field.

#### Standard Schema Pattern
```prisma
model [EntityName] {
  id             String   @id @default(cuid())
  organizationId String   // CRITICAL: Multi-tenant isolation
  // ... entity-specific fields
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  createdBy      String
  updatedBy      String?
  deletedAt      DateTime? // Soft delete for audit trails
  deletedBy      String?
  
  // Relations
  organization   Organization @relation(fields: [organizationId], references: [id])
  
  // CRITICAL: Index for query performance
  @@index([organizationId])
}
```

### Required Fields for All Tables
1. **id**: Unique identifier (use cuid() for better distribution)
2. **organizationId**: Tenant isolation (except for system-wide tables)
3. **createdAt**: Timestamp of creation
4. **updatedAt**: Timestamp of last modification
5. **createdBy**: User ID who created the record
6. **updatedBy**: User ID who last modified the record
7. **deletedAt**: Soft delete timestamp (null if not deleted)
8. **deletedBy**: User ID who deleted the record

### Audit Trail Table
Every database operation should be logged:

```prisma
model AuditLog {
  id             String   @id @default(cuid())
  organizationId String
  userId         String
  action         String   // "CREATE", "UPDATE", "DELETE", "READ"
  entityType     String   // Table name
  entityId       String   // Record ID
  oldValues      Json?    // Previous state (for UPDATE/DELETE)
  newValues      Json?    // New state (for CREATE/UPDATE)
  ipAddress      String?
  userAgent      String?
  timestamp      DateTime @default(now())
  
  @@index([organizationId])
  @@index([userId])
  @@index([timestamp])
  @@index([entityType, entityId])
}
```

### Database Query Pattern
**CRITICAL**: Every query MUST filter by organizationId

```typescript
// CORRECT - Always filter by organizationId
const invoices = await prisma.invoice.findMany({
  where: { organizationId: orgId }
})

// WRONG - Exposes all tenants' data
const invoices = await prisma.invoice.findMany()
```

### Prisma Client Setup
```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error']
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

---

## Security & Compliance

### Essential Security Measures

#### 1. Data Encryption
- **At Rest**: Enable PostgreSQL encryption on AWS RDS
- **In Transit**: Enforce HTTPS/TLS 1.3 for all connections
- **Sensitive Fields**: Use field-level encryption for highly sensitive data (credit cards, SSNs)

#### 2. Authentication & Authorization
- **Multi-Factor Authentication (MFA)**: Enforce for admin roles, optional for users
- **Role-Based Access Control (RBAC)**: Implement using Clerk's organization roles
- **Session Management**: Secure JWT tokens via Clerk
- **Password Policies**: Minimum 12 characters, complexity requirements

#### 3. API Security
```typescript
// Middleware pattern for API routes
export async function checkPermission(
  userId: string, 
  orgId: string, 
  permission: string
): Promise<boolean> {
  const { orgRole } = await auth()
  const rolePermissions = {
    admin: ['read:all', 'write:all', 'delete:all'],
    accountant: ['read:finance', 'write:finance'],
    manager: ['read:hr', 'write:hr', 'read:reports'],
    employee: ['read:own', 'write:own']
  }
  return rolePermissions[orgRole]?.includes(permission) || false
}
```

#### 4. Input Validation
- Validate all user inputs on server side
- Use Zod or similar for schema validation
- Sanitize inputs to prevent XSS and SQL injection (Prisma handles SQL injection)

#### 5. Rate Limiting
Implement rate limiting on API routes:
```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
})
```

### Compliance Requirements

#### SOC 2 Type II (Priority 1)
**Required Controls**:
- Access controls with MFA
- Audit logging for all data access
- Encryption at rest and in transit
- Regular security audits and penetration testing
- Incident response plan
- Data backup and recovery procedures
- Vendor management procedures

**Timeline**: Months 7-15 for SOC 2 Type II certification

#### GDPR (Required if serving EU customers)
**Required Features**:
- Consent management
- Right to access (data export)
- Right to erasure (delete account and all data)
- Right to rectification (update personal data)
- Data portability
- Privacy by design
- Data breach notification (within 72 hours)
- Data Processing Agreements (DPAs)

**Implementation**:
```typescript
// app/api/gdpr/export/route.ts
export async function POST(request: Request) {
  const { userId, orgId } = await auth()
  
  // Export all user data
  const userData = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      // Include all related data
      invoices: true,
      employees: true,
      // ... all entities
    }
  })
  
  return new Response(JSON.stringify(userData), {
    headers: { 'Content-Type': 'application/json' }
  })
}
```

#### ISO 27001 (Recommended for international markets)
- Information Security Management System (ISMS)
- Risk assessment and treatment
- Asset management
- Physical and environmental security
- Operations security
- Incident management

#### PCI DSS (If processing payments)
**Best Practice**: Use payment gateway (Stripe, Braintree) that handles PCI compliance
- Never store full credit card numbers
- Tokenize payment information
- Use payment gateway's hosted checkout when possible

### Data Backup Strategy
- **Frequency**: Automated daily backups
- **Retention**: 30 days for daily, 12 months for monthly
- **Location**: Cross-region replication (AWS S3)
- **Testing**: Quarterly recovery tests
- **RTO**: 4 hours (Recovery Time Objective)
- **RPO**: 24 hours (Recovery Point Objective)

---

## Multi-Tenant Strategy

### Phase 1: Pure Multi-Tenant (Launch - Month 12)
**Architecture**: Shared database, shared schema

**Implementation**:
```typescript
// All queries filter by organizationId
export async function getInvoices() {
  const { orgId } = await auth()
  
  return prisma.invoice.findMany({
    where: { organizationId: orgId }
  })
}
```

**Benefits**:
- Lower costs (~$50-200/month for database)
- Faster time to market
- Simpler to maintain
- Easier debugging

### Phase 2: Hybrid Architecture (When First Enterprise Customer Signs)
**Architecture**: Shared database for most customers + dedicated databases for enterprise

**Implementation**:
```typescript
// lib/prisma.ts - Enhanced version
import { PrismaClient } from '@prisma/client'
import { auth } from '@clerk/nextjs/server'

const connections = new Map<string, PrismaClient>()

export async function getPrismaClient() {
  const { orgId } = await auth()
  if (!orgId) throw new Error('No organization')
  
  // Check if organization has dedicated database
  const config = await getOrgConfig(orgId)
  
  const dbUrl = config?.dedicatedDatabaseUrl || process.env.DATABASE_URL
  
  // Reuse existing connection or create new one
  if (!connections.has(dbUrl)) {
    connections.set(dbUrl, new PrismaClient({
      datasources: { db: { url: dbUrl } }
    }))
  }
  
  return connections.get(dbUrl)!
}

// Organization configuration
interface OrgConfig {
  organizationId: string
  dedicatedDatabase: boolean
  dedicatedDatabaseUrl?: string
  plan: 'shared' | 'dedicated'
  dataResidency?: 'US' | 'EU' | 'APAC'
}

async function getOrgConfig(orgId: string): Promise<OrgConfig | null> {
  // Query configuration from control plane
  return await prisma.organizationConfig.findUnique({
    where: { organizationId: orgId }
  })
}
```

**Provisioning New Dedicated Database**:
```typescript
// scripts/provision-dedicated-db.ts
async function provisionDedicatedDatabase(
  orgId: string, 
  region: string
) {
  // 1. Create RDS instance via AWS SDK
  const dbInstance = await createRDSInstance({
    identifier: `erp-${orgId}`,
    region,
    instanceClass: 'db.t3.large',
    storageEncrypted: true
  })
  
  // 2. Run Prisma migrations
  await runMigrations(dbInstance.endpoint)
  
  // 3. Update organization config
  await prisma.organizationConfig.create({
    data: {
      organizationId: orgId,
      dedicatedDatabase: true,
      dedicatedDatabaseUrl: dbInstance.endpoint,
      plan: 'dedicated',
      dataResidency: region
    }
  })
  
  // 4. Migrate existing data if needed
  await migrateExistingData(orgId, dbInstance.endpoint)
}
```

### Clerk Organizations Setup
```typescript
// Clerk automatically provides:
// - userId: Current user ID
// - orgId: Current active organization ID
// - orgRole: User's role in current organization

import { auth } from '@clerk/nextjs/server'

export async function protectedAction() {
  const { userId, orgId, orgRole } = await auth()
  
  if (!userId) throw new Error('Unauthorized')
  if (!orgId) throw new Error('No organization selected')
  
  // Use orgId for data isolation
  // Use orgRole for permissions
}
```

### Pricing Structure
| Tier | Infrastructure | Users | Price/Month |
|------|---------------|-------|-------------|
| Starter | Shared DB | 5 | $99 |
| Professional | Shared DB | 25 | $499 |
| Enterprise | Dedicated DB | Unlimited | $2,499+ |
| Enterprise Plus | Dedicated DB + Custom Region | Unlimited | Custom |

---

## Module Specifications

### Implementation Order
**CRITICAL**: Implement modules one at a time in the following order:

1. **Foundation & Auth** (Week 1)
2. **Finance & Accounting** (Week 2-3)
3. **Customer Relationship Management (CRM)** (Week 4)
4. **Sales & Distribution** (Week 5)
5. **Inventory Management** (Week 6)
6. **Procurement/Purchasing** (Week 7)
7. **Human Resources & Payroll** (Week 8-9)
8. Remaining modules based on priority

---

### Module 1: Finance & Accounting

#### Overview
Core financial management system handling all accounting operations, financial reporting, and compliance.

#### Database Schema
```prisma
// Chart of Accounts
model Account {
  id             String   @id @default(cuid())
  organizationId String
  accountNumber  String
  accountName    String
  accountType    String   // ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
  parentId       String?
  balance        Decimal  @default(0)
  currency       String   @default("USD")
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  createdBy      String
  updatedBy      String?
  deletedAt      DateTime?
  deletedBy      String?
  
  organization   Organization @relation(fields: [organizationId], references: [id])
  parent         Account? @relation("AccountHierarchy", fields: [parentId], references: [id])
  children       Account[] @relation("AccountHierarchy")
  transactions   Transaction[]
  
  @@unique([organizationId, accountNumber])
  @@index([organizationId])
  @@index([accountType])
}

// General Ledger Transactions
model Transaction {
  id              String   @id @default(cuid())
  organizationId  String
  transactionDate DateTime
  description     String
  referenceNumber String?
  totalAmount     Decimal
  status          String   @default("POSTED") // DRAFT, POSTED, VOID
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  createdBy       String
  updatedBy       String?
  deletedAt       DateTime?
  deletedBy       String?
  
  organization    Organization @relation(fields: [organizationId], references: [id])
  entries         TransactionEntry[]
  
  @@index([organizationId])
  @@index([transactionDate])
  @@index([status])
}

// Double-entry accounting entries
model TransactionEntry {
  id            String   @id @default(cuid())
  transactionId String
  accountId     String
  debit         Decimal  @default(0)
  credit        Decimal  @default(0)
  description   String?
  
  transaction   Transaction @relation(fields: [transactionId], references: [id])
  account       Account @relation(fields: [accountId], references: [id])
  
  @@index([transactionId])
  @@index([accountId])
}

// Invoices
model Invoice {
  id              String   @id @default(cuid())
  organizationId  String
  invoiceNumber   String
  customerId      String
  invoiceDate     DateTime
  dueDate         DateTime
  subtotal        Decimal
  taxAmount       Decimal  @default(0)
  discountAmount  Decimal  @default(0)
  totalAmount     Decimal
  paidAmount      Decimal  @default(0)
  status          String   @default("DRAFT") // DRAFT, SENT, PAID, OVERDUE, VOID
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  createdBy       String
  updatedBy       String?
  deletedAt       DateTime?
  deletedBy       String?
  
  organization    Organization @relation(fields: [organizationId], references: [id])
  customer        Customer @relation(fields: [customerId], references: [id])
  lineItems       InvoiceLineItem[]
  payments        Payment[]
  
  @@unique([organizationId, invoiceNumber])
  @@index([organizationId])
  @@index([customerId])
  @@index([status])
  @@index([dueDate])
}

model InvoiceLineItem {
  id          String   @id @default(cuid())
  invoiceId   String
  description String
  quantity    Decimal
  unitPrice   Decimal
  taxRate     Decimal  @default(0)
  amount      Decimal
  
  invoice     Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  
  @@index([invoiceId])
}

// Bills (Accounts Payable)
model Bill {
  id              String   @id @default(cuid())
  organizationId  String
  billNumber      String
  vendorId        String
  billDate        DateTime
  dueDate         DateTime
  subtotal        Decimal
  taxAmount       Decimal  @default(0)
  totalAmount     Decimal
  paidAmount      Decimal  @default(0)
  status          String   @default("DRAFT") // DRAFT, APPROVED, PAID, OVERDUE, VOID
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  createdBy       String
  updatedBy       String?
  deletedAt       DateTime?
  deletedBy       String?
  
  organization    Organization @relation(fields: [organizationId], references: [id])
  vendor          Vendor @relation(fields: [vendorId], references: [id])
  lineItems       BillLineItem[]
  payments        Payment[]
  
  @@unique([organizationId, billNumber])
  @@index([organizationId])
  @@index([vendorId])
  @@index([status])
}

model BillLineItem {
  id          String   @id @default(cuid())
  billId      String
  description String
  quantity    Decimal
  unitPrice   Decimal
  taxRate     Decimal  @default(0)
  amount      Decimal
  
  bill        Bill @relation(fields: [billId], references: [id], onDelete: Cascade)
  
  @@index([billId])
}

// Payments
model Payment {
  id              String   @id @default(cuid())
  organizationId  String
  paymentNumber   String
  paymentDate     DateTime
  amount          Decimal
  paymentMethod   String   // CASH, CHECK, CREDIT_CARD, BANK_TRANSFER
  referenceNumber String?
  notes           String?
  invoiceId       String?
  billId          String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  createdBy       String
  updatedBy       String?
  deletedAt       DateTime?
  deletedBy       String?
  
  organization    Organization @relation(fields: [organizationId], references: [id])
  invoice         Invoice? @relation(fields: [invoiceId], references: [id])
  bill            Bill? @relation(fields: [billId], references: [id])
  
  @@unique([organizationId, paymentNumber])
  @@index([organizationId])
  @@index([invoiceId])
  @@index([billId])
}

// Budgets
model Budget {
  id             String   @id @default(cuid())
  organizationId String
  name           String
  fiscalYear     Int
  startDate      DateTime
  endDate        DateTime
  totalAmount    Decimal
  status         String   @default("DRAFT") // DRAFT, ACTIVE, CLOSED
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  createdBy      String
  updatedBy      String?
  deletedAt      DateTime?
  deletedBy      String?
  
  organization   Organization @relation(fields: [organizationId], references: [id])
  lineItems      BudgetLineItem[]
  
  @@index([organizationId])
  @@index([fiscalYear])
}

model BudgetLineItem {
  id          String   @id @default(cuid())
  budgetId    String
  accountId   String
  amount      Decimal
  period      String   // MONTHLY, QUARTERLY, ANNUAL
  
  budget      Budget @relation(fields: [budgetId], references: [id], onDelete: Cascade)
  account     Account @relation(fields: [accountId], references: [id])
  
  @@index([budgetId])
  @@index([accountId])
}
```

#### Key Features
1. **Chart of Accounts Management**
   - Create and manage account hierarchy
   - Support for standard account types (Asset, Liability, Equity, Revenue, Expense)
   - Multi-currency support

2. **General Ledger**
   - Double-entry bookkeeping
   - Transaction posting and reversal
   - Automatic account balance updates

3. **Accounts Receivable**
   - Invoice creation and management
   - Customer payment tracking
   - Aging reports

4. **Accounts Payable**
   - Bill management
   - Vendor payment processing
   - Payment due tracking

5. **Financial Reporting**
   - Balance Sheet
   - Profit & Loss (Income Statement)
   - Cash Flow Statement
   - Trial Balance
   - General Ledger Report

6. **Budgeting**
   - Annual/quarterly budget creation
   - Budget vs. actuals comparison
   - Budget approval workflows

#### API Endpoints
```typescript
// app/api/finance/accounts/route.ts
export async function GET(request: Request) {
  const { orgId } = await auth()
  const accounts = await prisma.account.findMany({
    where: { 
      organizationId: orgId,
      deletedAt: null
    },
    orderBy: { accountNumber: 'asc' }
  })
  return Response.json(accounts)
}

// app/api/finance/invoices/route.ts
export async function POST(request: Request) {
  const { orgId, userId } = await auth()
  const data = await request.json()
  
  // Validate data
  const validated = invoiceSchema.parse(data)
  
  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber(orgId)
  
  // Create invoice with line items in transaction
  const invoice = await prisma.invoice.create({
    data: {
      ...validated,
      organizationId: orgId,
      invoiceNumber,
      createdBy: userId,
      lineItems: {
        create: validated.lineItems
      }
    },
    include: { lineItems: true }
  })
  
  // Log audit trail
  await logAudit({
    organizationId: orgId,
    userId,
    action: 'CREATE',
    entityType: 'Invoice',
    entityId: invoice.id,
    newValues: invoice
  })
  
  return Response.json(invoice)
}
```

---

### Module 2: Human Resources & Payroll

#### Database Schema
```prisma
model Employee {
  id              String   @id @default(cuid())
  organizationId  String
  employeeNumber  String
  firstName       String
  lastName        String
  email           String
  phone           String?
  dateOfBirth     DateTime?
  hireDate        DateTime
  terminationDate DateTime?
  department      String?
  position        String
  employmentType  String   // FULL_TIME, PART_TIME, CONTRACT
  status          String   @default("ACTIVE") // ACTIVE, INACTIVE, TERMINATED
  salary          Decimal?
  currency        String   @default("USD")
  payFrequency    String?  // WEEKLY, BI_WEEKLY, MONTHLY
  managerId       String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  createdBy       String
  updatedBy       String?
  deletedAt       DateTime?
  deletedBy       String?
  
  organization    Organization @relation(fields: [organizationId], references: [id])
  manager         Employee? @relation("EmployeeManager", fields: [managerId], references: [id])
  directReports   Employee[] @relation("EmployeeManager")
  leaveRequests   LeaveRequest[]
  timesheets      Timesheet[]
  payrolls        PayrollEntry[]
  
  @@unique([organizationId, employeeNumber])
  @@index([organizationId])
  @@index([status])
  @@index([department])
}

model LeaveRequest {
  id             String   @id @default(cuid())
  organizationId String
  employeeId     String
  leaveType      String   // VACATION, SICK, PERSONAL, UNPAID
  startDate      DateTime
  endDate        DateTime
  days           Decimal
  reason         String?
  status         String   @default("PENDING") // PENDING, APPROVED, REJECTED
  approvedBy     String?
  approvedAt     DateTime?
  notes          String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  createdBy      String
  updatedBy      String?
  
  organization   Organization @relation(fields: [organizationId], references: [id])
  employee       Employee @relation(fields: [employeeId], references: [id])
  
  @@index([organizationId])
  @@index([employeeId])
  @@index([status])
}

model Timesheet {
  id             String   @id @default(cuid())
  organizationId String
  employeeId     String
  weekStartDate  DateTime
  weekEndDate    DateTime
  totalHours     Decimal
  status         String   @default("DRAFT") // DRAFT, SUBMITTED, APPROVED, REJECTED
  approvedBy     String?
  approvedAt     DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  createdBy      String
  updatedBy      String?
  
  organization   Organization @relation(fields: [organizationId], references: [id])
  employee       Employee @relation(fields: [employeeId], references: [id])
  entries        TimesheetEntry[]
  
  @@index([organizationId])
  @@index([employeeId])
  @@index([weekStartDate])
}

model TimesheetEntry {
  id          String   @id @default(cuid())
  timesheetId String
  date        DateTime
  hours       Decimal
  projectId   String?
  description String?
  
  timesheet   Timesheet @relation(fields: [timesheetId], references: [id], onDelete: Cascade)
  
  @@index([timesheetId])
}

model PayrollPeriod {
  id             String   @id @default(cuid())
  organizationId String
  periodStart    DateTime
  periodEnd      DateTime
  payDate        DateTime
  status         String   @default("DRAFT") // DRAFT, PROCESSING, COMPLETED
  totalGross     Decimal  @default(0)
  totalNet       Decimal  @default(0)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  createdBy      String
  updatedBy      String?
  
  organization   Organization @relation(fields: [organizationId], references: [id])
  entries        PayrollEntry[]
  
  @@index([organizationId])
  @@index([periodStart])
}

model PayrollEntry {
  id               String   @id @default(cuid())
  payrollPeriodId  String
  employeeId       String
  grossPay         Decimal
  deductions       Decimal
  taxes            Decimal
  netPay           Decimal
  hoursWorked      Decimal?
  
  payrollPeriod    PayrollPeriod @relation(fields: [payrollPeriodId], references: [id])
  employee         Employee @relation(fields: [employeeId], references: [id])
  
  @@index([payrollPeriodId])
  @@index([employeeId])
}
```

#### Key Features
1. **Employee Management**
2. **Leave Management**
3. **Time Tracking**
4. **Payroll Processing**
5. **Performance Management**
6. **Recruitment Tracking**

---

### Module 3: Inventory Management

#### Database Schema
```prisma
model InventoryItem {
  id              String   @id @default(cuid())
  organizationId  String
  sku             String
  name            String
  description     String?
  category        String?
  unit            String   // PIECE, KG, LITER, etc.
  costPrice       Decimal
  sellingPrice    Decimal
  reorderLevel    Int      @default(0)
  reorderQuantity Int      @default(0)
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  createdBy       String
  updatedBy       String?
  deletedAt       DateTime?
  deletedBy       String?
  
  organization    Organization @relation(fields: [organizationId], references: [id])
  stockLevels     StockLevel[]
  movements       InventoryMovement[]
  
  @@unique([organizationId, sku])
  @@index([organizationId])
  @@index([category])
}

model Warehouse {
  id             String   @id @default(cuid())
  organizationId String
  code           String
  name           String
  address        String?
  city           String?
  state          String?
  country        String?
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  createdBy      String
  updatedBy      String?
  
  organization   Organization @relation(fields: [organizationId], references: [id])
  stockLevels    StockLevel[]
  movements      InventoryMovement[]
  
  @@unique([organizationId, code])
  @@index([organizationId])
}

model StockLevel {
  id             String   @id @default(cuid())
  organizationId String
  itemId         String
  warehouseId    String
  quantity       Int      @default(0)
  lastUpdated    DateTime @updatedAt
  
  organization   Organization @relation(fields: [organizationId], references: [id])
  item           InventoryItem @relation(fields: [itemId], references: [id])
  warehouse      Warehouse @relation(fields: [warehouseId], references: [id])
  
  @@unique([itemId, warehouseId])
  @@index([organizationId])
  @@index([itemId])
  @@index([warehouseId])
}

model InventoryMovement {
  id              String   @id @default(cuid())
  organizationId  String
  itemId          String
  warehouseId     String
  movementType    String   // IN, OUT, TRANSFER, ADJUSTMENT
  quantity        Int
  referenceType   String?  // PURCHASE, SALE, TRANSFER, ADJUSTMENT
  referenceId     String?
  notes           String?
  movementDate    DateTime @default(now())
  createdAt       DateTime @default(now())
  createdBy       String
  
  organization    Organization @relation(fields: [organizationId], references: [id])
  item            InventoryItem @relation(fields: [itemId], references: [id])
  warehouse       Warehouse @relation(fields: [warehouseId], references: [id])
  
  @@index([organizationId])
  @@index([itemId])
  @@index([warehouseId])
  @@index([movementDate])
}
```

#### Key Features
1. **Item Management** - SKU, descriptions, pricing
2. **Multi-Warehouse Support** - Track inventory across locations
3. **Stock Movements** - In, out, transfers, adjustments
4. **Reorder Alerts** - Automated low stock notifications
5. **Inventory Valuation** - FIFO, LIFO, weighted average
6. **Lot & Serial Number Tracking**

---

### Module 4: Customer Relationship Management (CRM)

#### Database Schema
```prisma
model Customer {
  id              String   @id @default(cuid())
  organizationId  String
  customerNumber  String
  companyName     String
  contactPerson   String?
  email           String
  phone           String?
  website         String?
  address         String?
  city            String?
  state           String?
  country         String?
  postalCode      String?
  taxId           String?
  status          String   @default("ACTIVE") // ACTIVE, INACTIVE
  customerType    String   @default("INDIVIDUAL") // INDIVIDUAL, BUSINESS
  creditLimit     Decimal? @default(0)
  paymentTerms    String?  // NET_30, NET_60, IMMEDIATE
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  createdBy       String
  updatedBy       String?
  deletedAt       DateTime?
  deletedBy       String?
  
  organization    Organization @relation(fields: [organizationId], references: [id])
  invoices        Invoice[]
  contacts        Contact[]
  opportunities   Opportunity[]
  activities      Activity[]
  
  @@unique([organizationId, customerNumber])
  @@index([organizationId])
  @@index([status])
}

model Contact {
  id             String   @id @default(cuid())
  organizationId String
  customerId     String?
  firstName      String
  lastName       String
  email          String
  phone          String?
  position       String?
  isPrimary      Boolean  @default(false)
  notes          String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  createdBy      String
  updatedBy      String?
  
  organization   Organization @relation(fields: [organizationId], references: [id])
  customer       Customer? @relation(fields: [customerId], references: [id])
  
  @@index([organizationId])
  @@index([customerId])
}

model Lead {
  id             String   @id @default(cuid())
  organizationId String
  firstName      String
  lastName       String
  companyName    String?
  email          String
  phone          String?
  source         String?  // WEBSITE, REFERRAL, CAMPAIGN
  status         String   @default("NEW") // NEW, CONTACTED, QUALIFIED, LOST
  assignedTo     String?
  notes          String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  createdBy      String
  updatedBy      String?
  
  organization   Organization @relation(fields: [organizationId], references: [id])
  
  @@index([organizationId])
  @@index([status])
  @@index([assignedTo])
}

model Opportunity {
  id             String   @id @default(cuid())
  organizationId String
  customerId     String?
  name           String
  amount         Decimal
  stage          String   @default("PROSPECTING")
  probability    Int      @default(0) // 0-100
  expectedClose  DateTime?
  assignedTo     String?
  status         String   @default("OPEN") // OPEN, WON, LOST
  notes          String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  createdBy      String
  updatedBy      String?
  
  organization   Organization @relation(fields: [organizationId], references: [id])
  customer       Customer? @relation(fields: [customerId], references: [id])
  
  @@index([organizationId])
  @@index([customerId])
  @@index([stage])
  @@index([status])
}

model Activity {
  id             String   @id @default(cuid())
  organizationId String
  customerId     String?
  activityType   String   // CALL, EMAIL, MEETING, TASK, NOTE
  subject        String
  description    String?
  dueDate        DateTime?
  completedDate  DateTime?
  status         String   @default("PENDING") // PENDING, COMPLETED, CANCELLED
  assignedTo     String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  createdBy      String
  updatedBy      String?
  
  organization   Organization @relation(fields: [organizationId], references: [id])
  customer       Customer? @relation(fields: [customerId], references: [id])
  
  @@index([organizationId])
  @@index([customerId])
  @@index([status])
  @@index([assignedTo])
}
```

#### Key Features
1. **Customer Database** - Complete customer profiles
2. **Lead Management** - Track and qualify leads
3. **Opportunity Pipeline** - Sales opportunity tracking
4. **Activity Tracking** - Calls, meetings, emails, tasks
5. **Contact Management** - Multiple contacts per customer
6. **Sales Forecasting**

---

### Module 5: Sales & Distribution

#### Database Schema
```prisma
model SalesOrder {
  id              String   @id @default(cuid())
  organizationId  String
  orderNumber     String
  customerId      String
  orderDate       DateTime
  expectedDelivery DateTime?
  subtotal        Decimal
  taxAmount       Decimal  @default(0)
  shippingCost    Decimal  @default(0)
  totalAmount     Decimal
  status          String   @default("DRAFT")
  paymentStatus   String   @default("PENDING")
  shippingAddress String?
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  createdBy       String
  updatedBy       String?
  deletedAt       DateTime?
  deletedBy       String?
  
  organization    Organization @relation(fields: [organizationId], references: [id])
  customer        Customer @relation(fields: [customerId], references: [id])
  lineItems       SalesOrderLineItem[]
  shipments       Shipment[]
  
  @@unique([organizationId, orderNumber])
  @@index([organizationId])
  @@index([customerId])
  @@index([status])
}

model SalesOrderLineItem {
  id          String   @id @default(cuid())
  orderId     String
  itemId      String
  description String
  quantity    Decimal
  unitPrice   Decimal
  discount    Decimal  @default(0)
  taxRate     Decimal  @default(0)
  amount      Decimal
  
  order       SalesOrder @relation(fields: [orderId], references: [id], onDelete: Cascade)
  item        InventoryItem @relation(fields: [itemId], references: [id])
  
  @@index([orderId])
  @@index([itemId])
}

model Shipment {
  id              String   @id @default(cuid())
  organizationId  String
  orderId         String
  shipmentNumber  String
  shipmentDate    DateTime
  carrier         String?
  trackingNumber  String?
  status          String   @default("PENDING")
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  createdBy       String
  
  organization    Organization @relation(fields: [organizationId], references: [id])
  order           SalesOrder @relation(fields: [orderId], references: [id])
  
  @@unique([organizationId, shipmentNumber])
  @@index([organizationId])
  @@index([orderId])
}
```

---

### Module 6: Procurement/Purchasing

#### Database Schema
```prisma
model Vendor {
  id             String   @id @default(cuid())
  organizationId String
  vendorNumber   String
  companyName    String
  contactPerson  String?
  email          String
  phone          String?
  address        String?
  city           String?
  state          String?
  country        String?
  taxId          String?
  paymentTerms   String?
  status         String   @default("ACTIVE")
  notes          String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  createdBy      String
  updatedBy      String?
  deletedAt      DateTime?
  deletedBy      String?
  
  organization   Organization @relation(fields: [organizationId], references: [id])
  purchaseOrders PurchaseOrder[]
  bills          Bill[]
  
  @@unique([organizationId, vendorNumber])
  @@index([organizationId])
}

model PurchaseOrder {
  id              String   @id @default(cuid())
  organizationId  String
  poNumber        String
  vendorId        String
  orderDate       DateTime
  expectedDelivery DateTime?
  subtotal        Decimal
  taxAmount       Decimal  @default(0)
  totalAmount     Decimal
  status          String   @default("DRAFT")
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  createdBy       String
  updatedBy       String?
  
  organization    Organization @relation(fields: [organizationId], references: [id])
  vendor          Vendor @relation(fields: [vendorId], references: [id])
  lineItems       PurchaseOrderLineItem[]
  
  @@unique([organizationId, poNumber])
  @@index([organizationId])
  @@index([vendorId])
}

model PurchaseOrderLineItem {
  id          String   @id @default(cuid())
  poId        String
  itemId      String
  description String
  quantity    Decimal
  unitPrice   Decimal
  taxRate     Decimal  @default(0)
  amount      Decimal
  
  purchaseOrder PurchaseOrder @relation(fields: [poId], references: [id], onDelete: Cascade)
  item          InventoryItem @relation(fields: [itemId], references: [id])
  
  @@index([poId])
}
```

---

### Remaining Modules (Brief Schema References)

The following modules should follow similar patterns as above:

7. **Supply Chain Management** - Logistics, distribution, forecasting
8. **Manufacturing/Production** - BOM, work orders, production planning
9. **Warehouse Management** - Advanced warehouse operations
10. **Order Management** - Centralized order processing
11. **Quality Control** - Inspections, non-conformance tracking
12. **Asset Management** - Fixed asset tracking and depreciation
13. **Project Management** - Projects, tasks, resource allocation
14. **Business Intelligence** - Reports, dashboards, analytics
15. **Professional Services Automation** - Service delivery tracking
16. **E-commerce** - Online storefront integration
17. **Marketing Automation** - Campaigns, lead nurturing
18. **Contract Management** - Contract lifecycle management
19. **Maintenance Management** - Equipment maintenance scheduling
20. **Workforce Management** - Shift scheduling, time clocks
21. **Risk Management** - Risk assessment and mitigation
22. **Document Management** - Centralized document repository
23. **Product Lifecycle Management** - Product design and development

---

## Implementation Approach

### Phase-by-Phase Development

#### Phase 1: Foundation (Week 1)
**Goal**: Set up project infrastructure and authentication

**Tasks**:
1. Initialize Next.js 15 project with TypeScript
2. Set up Tailwind CSS
3. Configure Prisma with PostgreSQL
4. Set up Clerk authentication
5. Create base layout and navigation
6. Implement Organization model in Prisma
7. Set up audit logging infrastructure
8. Create base middleware for auth checks

**Deliverables**:
- Working authentication flow
- Organization creation and switching
- Base dashboard layout
- Audit logging system

#### Phase 2: Finance Module (Weeks 2-3)
**Goal**: Complete core accounting functionality

**Implementation Order**:
1. Chart of Accounts (Day 1-2)
2. General Ledger & Transactions (Day 3-4)
3. Invoices (Day 5-6)
4. Bills (Day 7-8)
5. Payments (Day 9)
6. Basic Financial Reports (Day 10)

**Deliverables**:
- Working accounting system
- Invoice generation
- Payment tracking
- Basic reports (P&L, Balance Sheet)

#### Phase 3: CRM Module (Week 4)
**Implementation Order**:
1. Customer management
2. Contact management
3. Lead tracking
4. Opportunity pipeline
5. Activity logging

#### Phase 4: Sales Module (Week 5)
**Implementation Order**:
1. Sales order creation
2. Order fulfillment workflow
3. Shipping management
4. Integration with inventory

#### Phase 5: Inventory Module (Week 6)
**Implementation Order**:
1. Item management
2. Warehouse setup
3. Stock level tracking
4. Inventory movements
5. Reorder alerts

#### Phase 6: Procurement Module (Week 7)
**Implementation Order**:
1. Vendor management
2. Purchase order creation
3. Receiving goods
4. Integration with AP

#### Phase 7: HR Module (Weeks 8-9)
**Implementation Order**:
1. Employee management
2. Leave management
3. Timesheet tracking
4. Basic payroll

#### Phase 8+: Additional Modules
Implement remaining modules based on customer demand and priority.

---

## Development Guidelines

### Code Organization Best Practices

#### Folder Structure
```
src/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── finance/
│   │   ├── hr/
│   │   └── inventory/
│   ├── api/
│   │   ├── finance/
│   │   ├── hr/
│   │   └── inventory/
│   └── layout.tsx
├── components/
│   ├── ui/          # shadcn components
│   ├── finance/
│   ├── hr/
│   └── shared/
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   ├── utils.ts
│   └── validations/
├── types/
└── hooks/
```

#### Server Actions Pattern
```typescript
// app/actions/invoices.ts
'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createInvoice(data: InvoiceInput) {
  const { userId, orgId } = await auth()
  
  if (!userId || !orgId) {
    throw new Error('Unauthorized')
  }
  
  // Validate input
  const validated = invoiceSchema.parse(data)
  
  // Create invoice
  const invoice = await prisma.invoice.create({
    data: {
      ...validated,
      organizationId: orgId,
      createdBy: userId,
      lineItems: {
        create: validated.lineItems
      }
    }
  })
  
  // Audit log
  await logAudit({
    organizationId: orgId,
    userId,
    action: 'CREATE',
    entityType: 'Invoice',
    entityId: invoice.id
  })
  
  revalidatePath('/finance/invoices')
  return invoice
}
```

#### API Route Pattern
```typescript
// app/api/finance/invoices/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { orgId } = await auth()
    
    if (!orgId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const invoices = await prisma.invoice.findMany({
      where: {
        organizationId: orgId,
        deletedAt: null
      },
      include: {
        customer: true,
        lineItems: true
      },
      orderBy: { invoiceDate: 'desc' }
    })
    
    return NextResponse.json(invoices)
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth()
    
    if (!userId || !orgId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    
    // Validation logic here
    
    const invoice = await prisma.invoice.create({
      data: {
        ...body,
        organizationId: orgId,
        createdBy: userId
      }
    })
    
    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Data Validation

Use Zod for all input validation:

```typescript
// lib/validations/invoice.ts
import { z } from 'zod'

export const invoiceLineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  taxRate: z.number().min(0).max(100).default(0),
})

export const invoiceSchema = z.object({
  customerId: z.string().cuid(),
  invoiceDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  lineItems: z.array(invoiceLineItemSchema).min(1),
  notes: z.string().optional(),
})

export type InvoiceInput = z.infer<typeof invoiceSchema>
```

### Error Handling

```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(message, 400, 'VALIDATION_ERROR')
  }
}

// Usage
try {
  // ... code
} catch (error) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    )
  }
  // Handle unexpected errors
  console.error('Unexpected error:', error)
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}
```

### Testing Strategy

```typescript
// __tests__/api/invoices.test.ts
import { POST } from '@/app/api/finance/invoices/route'

describe('Invoice API', () => {
  it('should create invoice with valid data', async () => {
    const request = new Request('http://localhost/api/finance/invoices', {
      method: 'POST',
      body: JSON.stringify({
        customerId: 'cust_123',
        invoiceDate: new Date(),
        dueDate: new Date(),
        lineItems: [
          {
            description: 'Service',
            quantity: 1,
            unitPrice: 100
          }
        ]
      })
    })
    
    const response = await POST(request)
    expect(response.status).toBe(201)
  })
})
```

---

## Critical Implementation Rules

### 1. ALWAYS Filter by organizationId
```typescript
// CORRECT
const data = await prisma.invoice.findMany({
  where: { organizationId: orgId }
})

// WRONG - Security vulnerability
const data = await prisma.invoice.findMany()
```

### 2. ALWAYS Log Audit Trails
```typescript
async function logAudit(params: AuditParams) {
  await prisma.auditLog.create({
    data: {
      organizationId: params.organizationId,
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      oldValues: params.oldValues,
      newValues: params.newValues,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      timestamp: new Date()
    }
  })
}
```

### 3. ALWAYS Use Soft Deletes
```typescript
// Instead of hard delete
await prisma.invoice.delete({ where: { id } })

// Use soft delete
await prisma.invoice.update({
  where: { id },
  data: {
    deletedAt: new Date(),
    deletedBy: userId
  }
})

// Filter out soft-deleted records
const invoices = await prisma.invoice.findMany({
  where: {
    organizationId: orgId,
    deletedAt: null  // IMPORTANT
  }
})
```

### 4. ALWAYS Validate Permissions
```typescript
async function checkPermission(
  userId: string,
  orgId: string,
  action: string
): Promise<boolean> {
  const { orgRole } = await auth()
  
  const permissions = {
    admin: ['*'],
    accountant: ['finance:*'],
    manager: ['hr:read', 'hr:write', 'reports:read'],
    employee: ['own:read', 'own:write']
  }
  
  const userPermissions = permissions[orgRole] || []
  
  return userPermissions.includes('*') || 
         userPermissions.includes(action) ||
         userPermissions.some(p => 
           p.endsWith(':*') && action.startsWith(p.split(':')[0])
         )
}
```

### 5. ALWAYS Use Database Transactions for Related Operations
```typescript
// Example: Creating invoice with line items
const invoice = await prisma.$transaction(async (tx) => {
  // Create invoice
  const newInvoice = await tx.invoice.create({
    data: {
      organizationId: orgId,
      customerId,
      invoiceDate,
      dueDate,
      totalAmount,
      createdBy: userId
    }
  })
  
  // Create line items
  await tx.invoiceLineItem.createMany({
    data: lineItems.map(item => ({
      invoiceId: newInvoice.id,
      ...item
    }))
  })
  
  // Update customer balance
  await tx.customer.update({
    where: { id: customerId },
    data: {
      balance: { increment: totalAmount }
    }
  })
  
  return newInvoice
})
```

---

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/erp_db"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# AWS (for production)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=erp-files

# Redis (optional, for caching)
REDIS_URL=redis://localhost:6379

# Sentry (error tracking)
SENTRY_DSN=https://...
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] All environment variables set
- [ ] Database migrations run
- [ ] Clerk production keys configured
- [ ] SSL certificate installed
- [ ] Database backups configured
- [ ] Monitoring tools set up (Sentry, CloudWatch)
- [ ] Rate limiting enabled
- [ ] Security headers configured

### Post-Deployment
- [ ] Test authentication flow
- [ ] Test organization creation
- [ ] Verify data isolation
- [ ] Test all critical workflows
- [ ] Monitor error rates
- [ ] Check database performance
- [ ] Verify backup restoration

---

## Performance Optimization

### Database Indexes
Ensure all foreign keys and frequently queried fields have indexes:

```prisma
model Invoice {
  // ...
  
  @@index([organizationId])
  @@index([customerId])
  @@index([status])
  @@index([invoiceDate])
  @@index([dueDate])
}
```

### Query Optimization
```typescript
// BAD - N+1 query problem
const invoices = await prisma.invoice.findMany()
for (const invoice of invoices) {
  const customer = await prisma.customer.findUnique({
    where: { id: invoice.customerId }
  })
}

// GOOD - Use include
const invoices = await prisma.invoice.findMany({
  include: {
    customer: true,
    lineItems: true
  }
})
```

### Caching Strategy
```typescript
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

async function getCachedInvoices(orgId: string) {
  const cacheKey = `invoices:${orgId}`
  
  // Try cache first
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)
  
  // Fetch from database
  const invoices = await prisma.invoice.findMany({
    where: { organizationId: orgId }
  })
  
  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(invoices))
  
  return invoices
}
```

---

## Support & Maintenance

### Monitoring
- Set up alerts for error rates > 1%
- Monitor database query performance
- Track API response times
- Monitor disk usage and database size

### Backup Strategy
- Daily automated backups
- Weekly full backups
- Monthly archival backups
- Test restoration quarterly

### Update Strategy
- Security patches: Apply within 48 hours
- Dependency updates: Monthly review
- Feature releases: Bi-weekly sprints
- Database migrations: Always test in staging first

---

## Conclusion

This document provides comprehensive specifications for building a multi-tenant SaaS ERP system. The key principles to remember:

1. **Start simple** - Build monolith first, modularize later if needed
2. **Security first** - Always filter by organizationId, audit everything
3. **One module at a time** - Complete each module before moving to the next
4. **Test thoroughly** - Especially multi-tenant isolation
5. **Document everything** - Code should be self-documenting with TypeScript

Follow this specification document sequentially, implementing one module at a time, and you'll have a production-ready ERP system that can scale from startup to enterprise.