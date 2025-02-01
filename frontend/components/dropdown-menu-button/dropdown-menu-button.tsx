import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlignJustify } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocationNavigation } from "@/lib/types";
import Link from "next/link";

interface DropdownMenuProps {
  menuItems: LocationNavigation[];
}

const DropdownMenuButton = ({ menuItems }: DropdownMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="sm:hidden h-8 gap-1">
          <AlignJustify className="h-3.5 w-3.5" />
          <span className="not-sr-only sm:whitespace-nowrap">Menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {menuItems.map((item) => (
          <Link key={item.id} href={item.uri}>
            <DropdownMenuItem key={item.id}>{item.label}</DropdownMenuItem>
          </Link>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DropdownMenuButton;
