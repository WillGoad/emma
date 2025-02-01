"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { getAccessibleData, getUserDetails } from "@/lib/api/api-utils";
import { DataProduct, KeyAuth, UserData, UserRole } from "@/lib/types";

interface UserContextProps {
  user: UserData | undefined;
  dataProducts: DataProduct[] | undefined;
  organisations: any[] | undefined;
  keyAuth: KeyAuth | undefined;
  isLoading: boolean;
  error: Error | null;
  refreshData: () => void;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [userData, setUserData] = useState<UserData | undefined>(undefined);
  const [dataProductsData, setDataProductsData] = useState<
    DataProduct[] | undefined
  >([]);
  const [organisationsData, setOrganisationsData] = useState<any[] | undefined>(
    [],
  );
  const [keyAuth, setKeyAuth] = useState<KeyAuth | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      const userData = await getUserDetails(refreshData);
      if (userData?.role) {
        setUserData(userData);
      } else {
        let guestUser: UserData = { role: UserRole.GUEST };
        setUserData(guestUser);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNonCoreData = async () => {
    try {
      const response = await getAccessibleData();
      console.log(response);
      if (response?.isSuccess && response.data) {
        const { dataProductsTableData, organisationsData, keyAuth } =
          response.data;
        setDataProductsData(dataProductsTableData);
        setOrganisationsData(organisationsData);
        setKeyAuth(keyAuth);
      }
    } catch (err) {
      console.error("Failed to fetch products data", err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchNonCoreData();
  }, []);

  const refreshData = () => {
    setIsLoading(true);
    fetchData();
    fetchNonCoreData();
  };

  return (
    <UserContext.Provider
      value={{
        user: userData,
        dataProducts: dataProductsData,
        organisations: organisationsData,
        keyAuth: keyAuth,
        isLoading: isLoading,
        error: error,
        refreshData: refreshData,
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
