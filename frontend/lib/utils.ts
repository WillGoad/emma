import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { setCookie, deleteCookie } from "cookies-next";

import { USER_TOKEN } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getInitialsFromName = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

export const setUserCookies = (accessToken: string) => {
  setCookie(USER_TOKEN, accessToken, {
    maxAge: 60 * 60 * 24 * 30, // 30 Days in seconds
    sameSite: "strict",
  });
};

//Function to delete all cookies
export const deleteAllCookies = () => {
  deleteCookie(USER_TOKEN);
};

export const formatDate = (date: string) => {
  const JSdate = new Date(date);

  // Convert to a readable format
  return JSdate.toLocaleString();
};

export const copyToClipboard = (toCopy: string, toast: any) => {
  navigator.clipboard.writeText(toCopy);
  toast({
    title: "Copied! 📋",
    description: "Copied to your clipboard.",
  });
};

export const formatSeconds = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  if (days > 0) return `${days} day${days !== 1 ? "s" : ""}`;
  return `${Math.floor(seconds / 3600)} hour${seconds !== 3600 ? "s" : ""}`;
};
