import { AdminDashboard } from "@/components/admin/pages/dashboard";
import { PageEnum, RouteConfig, UserRole } from "./types";
import { DataBuyerSettings } from "@/components/data-buyer/pages/settings";
import { DataExplorer } from "@/components/data-explorer/data-explorer";
import { AdminOperations } from "@/components/admin/pages/operations";

// MVP

export const roleBasedRoutes: Record<UserRole, RouteConfig[]> = {
  [UserRole.ADMIN]: [
    {
      id: PageEnum.EXPLORER,
      label: "Explorer",
      uri: "/",
      component: DataExplorer,
      showInNav: true,
      shortcut: "⇧⌘E",
    },
    {
      id: PageEnum.DASHBOARD,
      label: "Dashboard",
      uri: "/dashboard",
      component: AdminDashboard,
      showInNav: true,
      shortcut: "⇧⌘Z",
    },
    {
      id: PageEnum.OPERATIONS,
      label: "Operations",
      uri: "/operations",
      component: AdminOperations,
      showInNav: true,
    },
    {
      id: PageEnum.OPERATIONS_PRODUCTS,
      label: "Product Operations",
      uri: "/operations/products",
      component: AdminOperations,
      showInNav: false,
    },
    {
      id: PageEnum.OPERATIONS_PRODUCTS_DETAILS,
      label: "Product Details Operations",
      uri: "/operations/products/[id]",
      component: AdminOperations,
      showInNav: false,
    },
    {
      id: PageEnum.OPERATIONS_PRODUCTS_ADD_NEW,
      label: "Add New Product Operations",
      uri: "/operations/products/new",
      component: AdminOperations,
      showInNav: false,
    },
    {
      id: PageEnum.SETTINGS,
      label: "Settings",
      uri: "/settings",
      component: DataBuyerSettings,
      showInNav: true,
    },
    // { id: 'operations', label: 'Operations', component: AnalyticsPage },
  ],
  [UserRole.DATA_BUYER]: [
    {
      id: PageEnum.EXPLORER,
      label: "Explorer",
      uri: "/",
      component: DataExplorer,
      showInNav: true,
    },
    {
      id: PageEnum.SETTINGS,
      label: "Settings",
      uri: "/settings",
      component: DataBuyerSettings,
      showInNav: true,
    },
  ],
  [UserRole.DATA_PRODUCER]: [
    {
      id: PageEnum.EXPLORER,
      label: "Explorer",
      uri: "/",
      component: DataExplorer,
      showInNav: true,
    },
    // { id: 'dashboard', label: 'Dashboard', component: AdminDashboard },
    // { id: 'settings', label: 'settings', component: PaymentsPage },
    // { id: 'operations', label: 'Operations', component: AnalyticsPage },
  ],
  [UserRole.GUEST]: [
    {
      id: PageEnum.EXPLORER,
      label: "Explorer",
      uri: "/",
      component: DataExplorer,
    },
  ],
};

// Long term ambition

// export const roleBasedRoutes = {
//     [UserRole.ADMIN]: [
//         { id: 'dashboard', label: 'Dashboard', component: AdminDashboard },
//         { id: 'docs', label: 'Documentation', component: ProductsPage, shortcut: '⇧⌘U' },
//         { id: 'support', label: 'Support', component: CustomersPage, shortcut: '⇧⌘R' },
//         { id: 'settings', label: 'settings', component: PaymentsPage, shortcut: '⇧⌘Y' },
//         { id: 'operations', label: 'Operations', component: AnalyticsPage },
//         { id: 'analytics', label: 'Analytics', component: AnalyticsPage },
//     ],
//     [UserRole.DATA_BUYER]: [
//         { id: 'dashboard', label: 'Dashboard', component: DataBuyerDashboard },
//         { id: 'docs', label: 'Documentation', component: DataBuyerDocs },
//         { id: 'support', label: 'Support', component: CustomersPage },
//         { id: 'settings', label: 'settings', component: <DataBuyer> },
//     ],
//     [UserRole.DATA_PRODUCER]: [
//         { id: 'dashboard', label: 'Dashboard', component: AdminDashboard },
//         { id: 'docs', label: 'Documentation', component: ProductsPage },
//         { id: 'support', label: 'Support', component: CustomersPage },
//         { id: 'settings', label: 'settings', component: PaymentsPage },
//         { id: 'operations', label: 'Operations', component: AnalyticsPage },
//         { id: 'analytics', label: 'Analytics', component: AnalyticsPage },
//     ],
// };
