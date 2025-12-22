export type ModuleType = 
  | 'FINANCE' 
  | 'CRM' 
  | 'SALES' 
  | 'INVENTORY' 
  | 'PROCUREMENT' 
  | 'HR' 
  | 'ASSETS' 
  | 'PROJECTS' 
  | 'DOCUMENTS' 
  | 'MANUFACTURING' 
  | 'ECOMMERCE'

export const ALL_MODULES: { id: ModuleType; name: string; description: string; icon: string }[] = [
  { id: 'FINANCE', name: 'Finance', description: 'Invoices, bills, payments & budgets', icon: '💰' },
  { id: 'CRM', name: 'CRM', description: 'Customers, vendors, leads & opportunities', icon: '👥' },
  { id: 'SALES', name: 'Sales', description: 'Sales orders & shipments', icon: '🛒' },
  { id: 'INVENTORY', name: 'Inventory', description: 'Products, warehouses & stock', icon: '📦' },
  { id: 'PROCUREMENT', name: 'Procurement', description: 'Purchase orders & receiving', icon: '🛍️' },
  { id: 'HR', name: 'HR', description: 'Employees, leave & payroll', icon: '👤' },
  { id: 'ASSETS', name: 'Assets', description: 'Track company assets', icon: '💾' },
  { id: 'PROJECTS', name: 'Projects', description: 'Project management', icon: '📁' },
  { id: 'DOCUMENTS', name: 'Documents', description: 'Document storage', icon: '📄' },
  { id: 'MANUFACTURING', name: 'Manufacturing', description: 'BOM & work orders', icon: '🏭' },
  { id: 'ECOMMERCE', name: 'E-Commerce', description: 'Online stores', icon: '🏪' },
]

export const DEFAULT_MODULES: ModuleType[] = ['FINANCE', 'CRM', 'SALES', 'INVENTORY']
