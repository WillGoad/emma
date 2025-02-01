"use client";
import { Home, Package } from "lucide-react";

import { usePathname } from "next/navigation";

import DataProductsTable from "@/components/admin/tables/data-products-table";
import { LocationNavigation } from "@/lib/types";
import DropdownMenuButton from "@/components/dropdown-menu-button/dropdown-menu-button";
import AsideNavBar from "@/components/aside-nav-bar/aside-nav-bar";
import { LoadingPage } from "@/components/loading-page/loading-page";
import ProductDetails from "./productDetails";
import ProductAddNew from "./productAddNew";
import { useUserData } from "@/components/context/UserContext";

const adminDashboardLocationNavigation: LocationNavigation[] = [
  {
    label: "General",
    id: "general",
    uri: "/operations",
    icon: <Home className="h-5 w-5" />,
  },
  {
    label: "Products",
    id: "products",
    uri: "/operations/products",
    icon: <Package className="h-5 w-5" />,
  },
];

export function AdminOperations() {
  const { dataProducts } = useUserData();

  const pathname = usePathname();

  // Current path
  let currentComponent = <p>General</p>;

  switch (pathname) {
    case "/operations/products":
      if (dataProducts) {
        currentComponent = <DataProductsTable dataProducts={dataProducts} />;
      } else {
        currentComponent = <LoadingPage />;
      }
      break;
    case "/operations/products/new":
      currentComponent = <ProductAddNew />;
      break;
    case pathname.match(/^\/operations\/products\/.+$/)?.input:
      if (dataProducts) {
        currentComponent = <ProductDetails dataProducts={dataProducts} />;
      } else {
        currentComponent = <LoadingPage />;
      }
      break;
    default:
      currentComponent = <p>General</p>;
  }

  return (
    <div className="flex h-screen w-screen bg-muted/40">
      <AsideNavBar menuItems={adminDashboardLocationNavigation} />
      <div className="flex flex-col w-full sm:gap-4 sm:py-4 sm:pl-14">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 mb-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <DropdownMenuButton menuItems={adminDashboardLocationNavigation} />
        </header>
        {currentComponent}
      </div>
    </div>
  );
}
