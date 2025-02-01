"use client";

import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "../ui/button";
import { DataBuyerSettingsTab } from "@/lib/types";

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    handler: () => void;
    title: string;
  }[];
  currentTab: DataBuyerSettingsTab;
}

export function SidebarNav({
  className,
  items,
  currentTab,
  ...props
}: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1",
        className,
      )}
      {...props}
    >
      {items.map((item) => (
        <Button
          key={item.title}
          onClick={item.handler}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            pathname === currentTab
              ? "bg-muted hover:bg-muted text-black"
              : "bg-transparent hover:underline text-black",
            "justify-start",
          )}
        >
          {item.title}
        </Button>
      ))}
    </nav>
  );
}
