import { mutate } from "swr";
import { getCookie } from "cookies-next";
import { USER_TOKEN } from "../constants";

export const handleSubscribe = async (objectID: string) => {
  const token = await getCookie(USER_TOKEN);
  if (!token) return;
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/user/subscribe-user-to-data-product`,
    {
      method: "POST",
      headers: {
        "x-access-token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId: objectID,
      }),
    }
  );
  if (response.ok) {
    mutate("accessible-data");
    mutate("user");
  }
  return response;
};

export const handleUnsubscribe = async (objectID: string) => {
  const token = await getCookie(USER_TOKEN);
  if (!token) return;
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/user/unsubscribe-user-from-data-product`,
    {
      method: "POST",
      headers: {
        "x-access-token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId: objectID,
      }),
    }
  );
  if (response.ok) {
    mutate("accessible-data");
    mutate("user");
  }
  return response;
};

export const createAPIKey = async (ttl: number = 60 * 60 * 24 * 30) => {
  try {
    const accessToken = await getCookie(USER_TOKEN);
    if (!accessToken) return;
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/user/rotate-api-key`,
      {
        method: "POST",
        headers: {
          "x-access-token": accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ttl: ttl,
        }),
      }
    );
    if (response.ok) {
      mutate("accessible-data");
    } else {
      console.error("Error creating API key:", response.status);
      return { isSuccess: response.ok };
    }
    const data = await response.json();
    return { data, isSuccess: response.ok };
  } catch (error) {
    console.error(error);
    return;
  }
};

export const revokeAPIKey = async (keyId: string) => {
  try {
    const accessToken = await getCookie(USER_TOKEN);
    if (!accessToken) return;
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/user/delete-api-key`,
      {
        method: "POST",
        headers: {
          "x-access-token": accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keyId,
        }),
      }
    );
    if (response.ok) {
      mutate("accessible-data");
    } else {
      console.error("Error revoking API Key:", response.status);
      return { isSuccess: response.ok };
    }
    const data = await response.json();
    return { data, isSuccess: response.ok };
  } catch (error) {
    console.error(error);
    return;
  }
};
