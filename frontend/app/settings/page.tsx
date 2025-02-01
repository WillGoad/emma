"use client";

import { useUserData } from "@/components/context/UserContext";
import { LoadingPage } from "@/components/loading-page/loading-page";
import { PageEnum, UserRole } from "@/lib/types";
import { useToast } from "@/components/hooks/use-toast";
import NotFoundPage from "@/components/404-page/404-page";
import { roleBasedRoutes } from "@/lib/route-config";
import { AuthedNav } from "@/components/authed-nav/authed-nav";
import { createElement } from "react";

const SettingsPage = () => {
  const { user, isLoading, error } = useUserData();
  const { toast } = useToast();

  if (error) {
    toast({
      title: "Error! 😢",
      description: "An error occurred while fetching user information.",
    });
  }
  if (isLoading) return <LoadingPage />;

  const roleRoutes = roleBasedRoutes[user?.role as UserRole];
  const currentRoute = roleRoutes?.find(
    (route) => route.id === PageEnum.SETTINGS,
  );

  if (!currentRoute) return <NotFoundPage />;

  return (
    <>
      <AuthedNav />
      {createElement(currentRoute.component)}
    </>
  );
};

export default SettingsPage;
