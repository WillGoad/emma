"use client";
import { Metadata } from "next";
import { useSearchParams } from "next/navigation";

import { Separator } from "@/components/ui/separator";
import { SidebarNav } from "@/components/sidebar-nav/sidebar-nav";
import { useEffect, useState } from "react";
import { DataBuyerSettingsTab } from "@/lib/types";
import { CredentialsForm } from "../forms/credentials-form";

export const metadata: Metadata = {
  title: "Emma Data",
  description: "Emma Data",
};

export const DataBuyerSettings = () => {
  const searchParams = useSearchParams();
  const [currentTab, setCurrentTab] = useState<DataBuyerSettingsTab>(
    DataBuyerSettingsTab.ACCOUNT,
  );

  const sidebarNavItems = [
    {
      tab: DataBuyerSettingsTab.CREDENTIALS,
      title: "Credentials",
      handler: () => setCurrentTab(DataBuyerSettingsTab.CREDENTIALS),
      description: "Manage api keys and secrets.",
    },
    {
      tab: DataBuyerSettingsTab.ACCOUNT,
      title: "Account",
      handler: () => setCurrentTab(DataBuyerSettingsTab.ACCOUNT),
      description: "Change your account settings.",
    },
    {
      tab: DataBuyerSettingsTab.BILLING,
      title: "Billing",
      handler: () => setCurrentTab(DataBuyerSettingsTab.BILLING),
      description: "Manage your billing information.",
    },
  ];

  useEffect(() => {
    const tab = searchParams.get("tab");
    switch (tab?.toString().toLowerCase()) {
      case "credentials":
        setCurrentTab(DataBuyerSettingsTab.CREDENTIALS);
        break;
      case "account":
        setCurrentTab(DataBuyerSettingsTab.ACCOUNT);
        break;
      case "billing":
        setCurrentTab(DataBuyerSettingsTab.BILLING);
        break;
    }
  }, [searchParams]);

  return (
    <>
      <div className="space-y-6 p-10 pb-16 block">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your settings and preferences.
          </p>
        </div>
        <Separator className="my-6" />
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
          <aside className="-mx-4 lg:w-1/5">
            <SidebarNav
              className="flex-wrap"
              items={sidebarNavItems}
              currentTab={currentTab}
            />
          </aside>
          <div className="flex-1 lg:max-w-3xl">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">
                  {
                    sidebarNavItems.find((item) => item.tab === currentTab)
                      ?.title
                  }
                </h3>
                <p className="text-sm text-muted-foreground">
                  {
                    sidebarNavItems.find((item) => item.tab === currentTab)
                      ?.description
                  }
                </p>
              </div>
              <Separator />
              <CredentialsForm />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
