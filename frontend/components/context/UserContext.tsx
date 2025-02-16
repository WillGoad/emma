"use client";
import React, { createContext, useContext, useEffect } from "react";
import useSWR from "swr";
import { accessibleFetcher, userFetcher } from "@/lib/api/swr-fetchers";
import {
  DataProduct,
  KeyAuth,
  Organization,
  UserData,
  UserRole,
} from "@/lib/types";

interface UserContextProps {
  user: UserData;
  dataProducts: DataProduct[] | undefined;
  organisations: Organization[] | undefined;
  keyAuth: KeyAuth | undefined;
  isLoading: boolean;
  error: Error | null;
  mutateUser: () => void;
  mutateAccessible: () => void;
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
    mutate: mutateUser,
  } = useSWR("user", userFetcher);

  // Accessible data SWR hook (depends on user data)
  const {
    data: accessibleData,
    error: accessibleError,
    isLoading: isAccessibleLoading,
    mutate: mutateAccessible,
  } = useSWR("accessible-data", accessibleFetcher);

  // Combined loading state
  const isLoading = isUserLoading || isAccessibleLoading;
  // Combined error state
  const error = userError || accessibleError || null;

  // Determine user object
  const user = userData?.role ? userData : { role: UserRole.GUEST };

  useEffect(() => {
    mutateAccessible();
    mutateUser();
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        dataProducts: accessibleData?.dataProducts,
        organisations: accessibleData?.organizations,
        keyAuth: accessibleData?.keyAuth,
        isLoading,
        error,
        mutateUser,
        mutateAccessible,
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
