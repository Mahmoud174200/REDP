import {
  Phone, Handshake, Network, Building2, Users, FileText, ShieldCheck, CreditCard,
  CheckSquare, AlertTriangle, Wrench, BarChart3, Terminal, Settings, Bell, Shield,
  MessageSquare, ShieldAlert, FolderTree, Award, Wallet, Brain, TrendingUp, Globe, Hammer,
  SlidersHorizontal,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────
// REDP — Single source of truth for the dashboard sidebar menu.
// Consumed by both <Sidebar /> (rendering) and the admin
// "Menu Settings" page (show / hide / delete management).
// ─────────────────────────────────────────────────────────

export interface MenuItem {
  name: string;
  path: string;
  icon: any;            // lucide component or a font-awesome className string
  roles?: string[];     // per-item role override
  brokerOwnerOnly?: boolean;
  /** Locked items can never be hidden/deleted (so admins can't lock themselves out). */
  locked?: boolean;
}

export interface MenuSection {
  title: string;
  roles: string[];
  items: MenuItem[];
}

export const menuItems: MenuSection[] = [
  {
    title: 'Tier 1: Tele-Sales',
    roles: ['admin', 'tele_sales'],
    items: [
      { name: 'Tele-Sales Portal', path: '/sales/tele/dashboard', icon: Phone },
    ],
  },
  {
    title: 'Tier 2: Broker Portal',
    roles: ['admin', 'broker'],
    items: [
      { name: 'Broker Dashboard', path: '/sales/broker/dashboard', icon: Handshake },
      { name: 'Company Management', path: '/sales/broker/company', icon: Network, brokerOwnerOnly: true },
    ],
  },
  {
    title: 'Tier 3: Company Sales',
    roles: ['admin', 'company_sales'],
    items: [
      { name: 'Company Sales Portal', path: '/sales/company/dashboard', icon: Building2 },
    ],
  },
  {
    title: 'Acquisition',
    roles: ['admin', 'sales_agent', 'company_sales'],
    items: [
      { name: 'Leads & Appointments', path: '/acquisition/leads', icon: Users },
      { name: 'CRM Pipeline', path: '/acquisition/crm', icon: 'fa-solid fa-chart-simple' },
      { name: 'Broker Portal', path: '/acquisition/brokers', icon: 'fa-solid fa-handshake' },
      { name: 'Broker Agencies', path: '/acquisition/broker-companies', icon: Network, roles: ['admin', 'company_sales'] },
      { name: 'KYC Approvals', path: '/acquisition/kyc', icon: 'fa-solid fa-shield-halved' },
      { name: 'Campaigns Analytics', path: '/acquisition/campaigns', icon: 'fa-solid fa-bullhorn' },
      { name: 'EOI Reservations', path: '/acquisition/eoi-reservations', icon: FileText },
    ],
  },
  {
    title: 'Finance & Contracts',
    roles: ['admin', 'finance_officer', 'company_sales', 'executive'],
    items: [
      { name: 'Units Inventory', path: '/finance/inventory', icon: Building2, roles: ['admin', 'company_sales', 'broker', 'executive'] },
      { name: 'Reserved Units', path: '/finance/reserved', icon: ShieldCheck, roles: ['admin', 'finance_officer', 'company_sales', 'broker', 'executive'] },
      { name: 'Financial Overview', path: '/finance/payments', icon: CreditCard, roles: ['admin', 'finance_officer', 'executive'] },
      { name: 'Plan Approvals', path: '/finance/plan-approvals', icon: CheckSquare, roles: ['admin', 'finance_officer'] },
      { name: 'Contracts Vault', path: '/finance/contracts', icon: FileText, roles: ['admin', 'finance_officer', 'company_sales', 'executive'] },
      { name: 'Collections Queue', path: '/finance/collections', icon: AlertTriangle, roles: ['admin', 'finance_officer', 'executive'] },
    ],
  },
  {
    title: 'Delivery & Platform',
    roles: ['admin', 'delivery_engineer', 'handover_officer', 'client', 'project_manager', 'maintenance_manager', 'executive'],
    items: [
      { name: 'Handovers Control', path: '/delivery/overview', icon: Building2, roles: ['admin', 'handover_officer', 'client', 'executive'] },
      { name: 'Maintenance Tickets', path: '/delivery/maintenance', icon: Wrench, roles: ['admin', 'delivery_engineer', 'maintenance_manager'] },
      { name: 'My Handover Tasks', path: '/delivery/handover', icon: ShieldCheck, roles: ['admin', 'delivery_engineer', 'project_manager'] },
      { name: 'Documents Vault', path: '/delivery/documents', icon: FileText, roles: ['admin', 'handover_officer', 'client', 'executive'] },
      { name: 'BI Analytics', path: '/delivery/analytics', icon: BarChart3, roles: ['admin', 'handover_officer', 'project_manager', 'executive'] },
      { name: 'Visual Workflows', path: '/delivery/workflows', icon: Terminal, roles: ['admin', 'handover_officer', 'project_manager'] },
    ],
  },
  {
    title: 'System Settings',
    roles: ['admin'],
    items: [
      { name: 'Admin Control Panel', path: '/admin/panel', icon: Settings, roles: ['admin'] },
      { name: 'Menu Settings', path: '/admin/menu-settings', icon: SlidersHorizontal, roles: ['admin'], locked: true },
      { name: 'Marketing Campaigns', path: '/admin/campaigns', icon: Bell, roles: ['admin'] },
    ],
  },
  {
    title: 'Enterprise',
    roles: ['admin', 'executive', 'project_manager', 'finance_officer', 'legal_officer', 'company_sales'],
    items: [
      { name: 'Organization', path: '/enterprise/organization', icon: Network, roles: ['admin', 'executive'] },
      { name: 'RBAC Engine', path: '/enterprise/rbac', icon: Shield, roles: ['admin'] },
      { name: 'Approval Workflows', path: '/enterprise/workflows', icon: CheckSquare, roles: ['admin', 'executive'] },
      { name: 'Legal Disputes', path: '/enterprise/legal', icon: FileText, roles: ['admin', 'executive', 'legal_officer'] },
      { name: 'Customer 360', path: '/enterprise/customer360', icon: Users, roles: ['admin', 'executive', 'company_sales'] },
      { name: 'Task Board', path: '/enterprise/tasks', icon: CheckSquare, roles: ['admin', 'executive', 'project_manager'] },
      { name: 'Message Hub', path: '/enterprise/messages', icon: MessageSquare, roles: ['admin', 'executive'] },
      { name: 'Audit Logs', path: '/enterprise/audit', icon: ShieldAlert, roles: ['admin'] },
      { name: 'Chart of Accounts', path: '/enterprise/accounting/chart', icon: FolderTree, roles: ['admin', 'executive', 'finance_officer'] },
      { name: 'Journal Vouchers', path: '/enterprise/accounting/entries', icon: FileText, roles: ['admin', 'executive', 'finance_officer'] },
      { name: 'Financial Reports', path: '/enterprise/accounting/reports', icon: BarChart3, roles: ['admin', 'executive', 'finance_officer'] },
      { name: 'Expense Budgets', path: '/enterprise/accounting/budgets', icon: Award, roles: ['admin', 'executive', 'finance_officer'] },
      { name: 'Purchase Requests', path: '/enterprise/procurement/requests', icon: FileText, roles: ['admin', 'executive', 'finance_officer', 'project_manager'] },
      { name: 'Requests for Quote (RFQ)', path: '/enterprise/procurement/rfqs', icon: MessageSquare, roles: ['admin', 'executive', 'project_manager'] },
      { name: 'Purchase Orders (PO)', path: '/enterprise/procurement/orders', icon: FileText, roles: ['admin', 'executive', 'project_manager'] },
      { name: 'Goods Receipts', path: '/enterprise/procurement/receipts', icon: CheckSquare, roles: ['admin', 'executive', 'project_manager'] },
      { name: 'Vendor Invoices', path: '/enterprise/procurement/invoices', icon: Wallet, roles: ['admin', 'executive', 'finance_officer'] },
      { name: 'Commission Rules', path: '/enterprise/commission/rules', icon: Award, roles: ['admin', 'executive'] },
      { name: 'Commission Ledger', path: '/enterprise/commission/ledger', icon: FileText, roles: ['admin', 'executive'] },
      { name: 'Commission Payouts', path: '/enterprise/commission/payouts', icon: Wallet, roles: ['admin', 'executive', 'finance_officer'] },
      { name: 'AI Predictive Operations', path: '/enterprise/ai', icon: Brain, roles: ['admin', 'executive'] },
      { name: 'Executive BI Dashboard', path: '/enterprise/dashboard', icon: TrendingUp, roles: ['admin', 'executive'] },
      { name: 'SaaS Tenant Config', path: '/enterprise/tenant', icon: Shield, roles: ['admin'] },
      { name: 'Globalization & i18n', path: '/enterprise/globalization', icon: Globe, roles: ['admin'] },
      { name: 'Construction Progress', path: '/enterprise/construction', icon: Hammer, roles: ['admin', 'executive', 'project_manager'] },
      { name: 'Quality Inspections', path: '/enterprise/quality', icon: ShieldCheck, roles: ['admin', 'executive', 'project_manager', 'delivery_engineer'] },
    ],
  },
];
