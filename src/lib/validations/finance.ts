import { z } from 'zod'

// Account Types
export const AccountType = {
  ASSET: 'ASSET',
  LIABILITY: 'LIABILITY',
  EQUITY: 'EQUITY',
  REVENUE: 'REVENUE',
  EXPENSE: 'EXPENSE',
} as const

export type AccountType = (typeof AccountType)[keyof typeof AccountType]

// Validation Schemas
export const createAccountSchema = z.object({
  accountNumber: z.string().min(1, 'Account number is required').max(20),
  accountName: z.string().min(1, 'Account name is required').max(100),
  accountType: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
  parentId: z.string().nullable().optional(),
  currency: z.string().optional().default('USD'),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional().default(true),
})

export const updateAccountSchema = createAccountSchema.partial().extend({
  id: z.string(),
})

export type CreateAccountInput = z.input<typeof createAccountSchema>
export type UpdateAccountInput = z.input<typeof updateAccountSchema>

// Invoice Schemas
export const invoiceLineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().nonnegative('Unit price must be non-negative'),
  taxRate: z.number().min(0).max(100).default(0),
})

export const createInvoiceSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  invoiceDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  lineItems: z.array(invoiceLineItemSchema).min(1, 'At least one line item is required'),
  notes: z.string().nullable().optional(),
})

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>

// Customer Schemas
export const createCustomerSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactPerson: z.string().nullable().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().nullable().optional(),
  website: z.string().url().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  taxId: z.string().nullable().optional(),
  customerType: z.enum(['INDIVIDUAL', 'BUSINESS']).default('BUSINESS'),
  creditLimit: z.number().nonnegative().nullable().optional(),
  paymentTerms: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>

// Vendor Schemas
export const createVendorSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactPerson: z.string().nullable().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  taxId: z.string().nullable().optional(),
  paymentTerms: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export type CreateVendorInput = z.infer<typeof createVendorSchema>
