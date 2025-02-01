"use client";

import NotFoundPage from "@/components/404-page/404-page";
import { AuthedNav } from "@/components/authed-nav/authed-nav";
import { useUserData } from "@/components/context/UserContext";
import { LoadingPage } from "@/components/loading-page/loading-page";
import { roleBasedRoutes } from "@/lib/route-config";
import { UserRole, PageEnum } from "@/lib/types";
import { createElement } from "react";

const Page = () => {
  const { user, isLoading, error } = useUserData();

  if (error) {
    console.error("An error occurred while fetching user information.", error);
  }
  console.log(isLoading);
  if (isLoading) return <LoadingPage />;
  const roleRoutes = roleBasedRoutes[user?.role as UserRole];
  const currentRoute = roleRoutes?.find(
    (route) => route.id === PageEnum.EXPLORER,
  );

  if (!currentRoute) return <NotFoundPage />;

  return (
    <>
      <AuthedNav />
      {createElement(currentRoute.component)}
    </>
  );
};

export default Page;
