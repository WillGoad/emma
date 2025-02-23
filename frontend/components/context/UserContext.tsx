"use client";
import React, { createContext, useContext } from "react";
import useSWR from "swr";
import { accessibleFetcher, userFetcher } from "@/lib/api/swr-fetchers";
import {
  DataProduct,
  KeyAuth,
  Organization,
  UserData,
} from "@/lib/types";

interface UserContextProps {
  user: UserData;
  dataProducts: DataProduct[] | undefined;
  organisations: Organization[] | undefined;
  keyAuth: KeyAuth | undefined;
  isLoading: boolean;
  error: Error | null;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // User data SWR hook
  const {
    data: userData,
    error: userError,
    isLoading: isUserLoading,
  } = useSWR("user", userFetcher);

  // Accessible data SWR hook (depends on user data)
  const {
    data: accessibleData,
    error: accessibleError,
    isLoading: isAccessibleLoading,
  } = useSWR(userData ? "accessible-data" : null, accessibleFetcher);

  const isLoading = isUserLoading || isAccessibleLoading;
  const error = userError || accessibleError || null;

  return (
    <UserContext.Provider
      value={{
        user: userData,
        dataProducts: accessibleData?.dataProducts,
        organisations: accessibleData?.organizations,
        keyAuth: accessibleData?.keyAuth,
        isLoading,
        error,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserData = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUserData must be used within a UserProvider");
  }
  return context;
};
