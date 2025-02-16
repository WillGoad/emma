import { getCookie } from "cookies-next";
import { USER_TOKEN } from "../constants";
import { AccessibleData, UserRole } from "../types";

export const userFetcher = async () => {
  try {
    const accessToken = await getCookie(USER_TOKEN);
    if (!accessToken) return { role: UserRole.GUEST }; // Return guest if no token
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/user/get-user-details`,
      {
        method: "POST",
        headers: {
          "x-access-token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );
    const data = await response.json();
    return data?.role ? data : { role: UserRole.GUEST };
  } catch (error) {
    return { role: UserRole.GUEST };
  }
};

export const accessibleFetcher = async () => {
  try {
    const accessToken = await getCookie(USER_TOKEN);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (accessToken) {
      headers["x-access-token"] = accessToken;
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/dashboard/get-dashboard-data`,
      {
        method: "GET",
        headers,
      }
    );
    if (!response.ok) {
      throw new Error(`Error getting dashboard data: ${response.status}`);
    }
    const data: AccessibleData = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return;
  }
};
