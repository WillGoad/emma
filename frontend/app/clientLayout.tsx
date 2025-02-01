"use client";

import { UserProvider } from "@/components/context/UserContext";
import Hotkeys from "@/lib/hot-keys";
import { Toaster } from "@/components/ui/toaster";

import { useState } from "react";
import SearchInput from "@/components/search-input/search-input";
import { SearchInterfaceMode } from "@/lib/types";
import { TooltipProvider } from "@/components/ui/tooltip";

const ClientLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [open, setOpen] = useState(false);

  const toggleSearchDialog = () => {
    setOpen((open) => !open);
  };

  return (
    <UserProvider>
      <TooltipProvider>
        <Hotkeys toggleSearchDialog={toggleSearchDialog} />
        {children}
        <Toaster />
        <SearchInput
          mode={SearchInterfaceMode.DIALOG}
          open={open}
          setOpen={setOpen}
        />
      </TooltipProvider>
    </UserProvider>
  );
};

export default ClientLayout;
