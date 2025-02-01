import { FilterType } from "./types";

export const USER_TOKEN = "user-token";

const JWT_SECRET_KEY: string | undefined = process.env.JWT_SECRET_KEY!;

export function getJwtSecretKey(): string {
  if (!JWT_SECRET_KEY || JWT_SECRET_KEY.length === 0) {
    throw new Error("The environment variable JWT_SECRET_KEY is not set.");
  }
  return JWT_SECRET_KEY;
}

export const organizationIdMap: { [key: string]: string } = {
  "casablanca-stock-exchange": "CASABLANCA_ORG_ID",
  "nairobi-securities-exchange": "NAIROBI_ORG_ID",
  "palestine-exchange": "PALESTINE_ORG_ID",
  "zimbabwe-stock-exchange": "ZIMBABWE_ORG_ID",
  "qatar-stock-exchange": "QATAR_ORG_ID",
  "bahrain-bourse": "BAHRAIN_ORG_ID",
};

export const FiltersArray: FilterType[] = [
  { id: "all", icon: "💯", label: "All" },
  { id: "free", icon: "♾️", label: "Free" },
  { id: "paid", icon: "💰", label: "Paid" },
  {
    id: "casablanca-stock-exchange",
    icon: "🇲🇦",
    label: "Casablanca Stock Exchange",
  },
  {
    id: "nairobi-securities-exchange",
    icon: "🇰🇪",
    label: "Nairobi Securities Exchange",
  },
  { id: "palestine-exchange", icon: "🇵🇸", label: "Palestine Exchange" },
  {
    id: "zimbabwe-stock-exchange",
    icon: "🇿🇼",
    label: "Zimbabwe Stock Exchange",
  },
  { id: "qatar-stock-exchange", icon: "🇶🇦", label: "Qatar Stock Exchange" },
  { id: "bahrain-bourse", icon: "🇧🇭", label: "Bahrain Bourse" },
];
