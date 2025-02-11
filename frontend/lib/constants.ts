import { FilterType } from "./types";

export const USER_TOKEN = "user-token";

const JWT_SECRET_KEY: string | undefined = process.env.JWT_SECRET_KEY!;

export function getJwtSecretKey(): string {
  if (!JWT_SECRET_KEY || JWT_SECRET_KEY.length === 0) {
    throw new Error("The environment variable JWT_SECRET_KEY is not set.");
  }
  return JWT_SECRET_KEY;
}

export const FiltersArray: FilterType[] = [
  { id: "all", icon: "💯", label: "All" },
  { id: "free", icon: "♾️", label: "Free" },
  { id: "paid", icon: "💰", label: "Paid" },
];
