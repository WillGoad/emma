export enum UserRole {
  ADMIN = "ADMIN",
  DATA_BUYER = "DATA_BUYER",
  DATA_PRODUCER = "DATA_PRODUCER",
  GUEST = "GUEST",
}

export interface UserData {
  subscriptions?: string[];
  role?: UserRole;
  dataProducts?: any[];
  organisations?: any[];
  userName?: string;
  email?: string;
  picture?: string;
  balances?: any[];
}

export enum PageEnum {
  EXPLORER = "EXPLORER",
  DASHBOARD = "DASHBOARD",
  DOCS = "DOCS",
  SUPPORT = "SUPPORT",
  SETTINGS = "SETTINGS",
  OPERATIONS = "OPERATIONS",
  OPERATIONS_PRODUCTS = "OPERATIONS_PRODUCTS",
  OPERATIONS_PRODUCTS_DETAILS = "OPERATIONS_PRODUCTS_DETAILS",
  OPERATIONS_PRODUCTS_ADD_NEW = "OPERATIONS_PRODUCTS_ADD_NEW",
}

export enum DataBuyerSettingsTab {
  CREDENTIALS = "CREDENTIALS",
  ACCOUNT = "ACCOUNT",
  BILLING = "BILLING",
}

export enum SearchInterfaceMode {
  DIALOG,
  INSET,
}

export type FilterType = {
  id: string;
  icon?: string;
  image?: string;
  label: string;
};

export type breadcrumbLocation = {
  label: string;
  id: string;
  child?: breadcrumbLocation;
};

type location = {
  breadcrumbs: breadcrumbLocation;
  component:
    | ((dashboardData: AccessibleData) => JSX.Element)
    | (() => JSX.Element);
};

export interface LocationDictionary {
  [location: string]: location;
}

export type LocationNavigation = {
  label: string;
  id: string;
  uri: string;
  icon: JSX.Element;
};

export enum DataProductStatus {
  LIVE = "LIVE",
  DRAFT = "DRAFT",
  ARCHIVED = "ARCHIVED",
}

export enum PricingMode {
  FREE = "FREE",
  SUBSCRIPTION = "SUBSCRIPTION",
  PAY_PER_REQUEST = "PAY_PER_REQUEST",
  PAY_PER_GB = "PAY_PER_GB",
}

enum PaymentInterval {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  YEARLY = "YEARLY",
}

type User = {
  id: string;
  email: string;
  role: UserRole;
  organisation: string;
};

export type DataProduct = {
  id: string;
  name: string;
  description: string;
  status: DataProductStatus;
  accessURL: string;
  upstreamURL: string;
  updatedAt: string;
  createdAt: string;
  price: number;
  currency: string;
  pricingMode: PricingMode;
  paymentInterval: PaymentInterval;
  organisation: any;
  organisationID: string;
  users: User[];
  kongDetails: DataProductKongDetails;
};

type DataProductKongDetails = {
  serviceResponseBody: any;
  routeResponseBody: any;
};

export type KeyAuth = {
  id: string;
  key: string;
  ttl: number;
};

// Data that user can access stored in context

export type AccessibleData = {
  dataProductsTableData: DataProduct[];
  organisationsData: any[];
  customersTableData: any[];
  paymentsTableData: any[];
  keyAuth: KeyAuth;
};

export type RouteConfig = {
  id: PageEnum;
  label: string;
  uri: string;
  component: React.ComponentType;
  showInNav?: boolean;
  shortcut?: string;
};
