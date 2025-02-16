import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteAllCookies, getInitialsFromName } from "@/lib/utils";
import Link from "next/link";
import { useUserData } from "../context/UserContext";
import { PageEnum, RouteConfig, UserRole } from "@/lib/types";
import { roleBasedRoutes } from "@/lib/route-config";

export function UserNav() {
  const { user } = useUserData();

  const roleRoutes: RouteConfig[] = roleBasedRoutes[user?.role as UserRole];

  const handleLogout = () => {
    deleteAllCookies();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar>
            <AvatarImage src={String(user?.picture)} />
            <AvatarFallback>
              {getInitialsFromName(String(user?.email))}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {String(user?.email)}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {String(user?.userName)}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {roleRoutes
            .filter((route) => route.showInNav)
            .map((route) => (
              <Link key={route.id} href={route.uri} passHref>
                <DropdownMenuItem>
                  {route.label}
                  {route.shortcut && (
                    <DropdownMenuShortcut>
                      {route.shortcut}
                    </DropdownMenuShortcut>
                  )}
                </DropdownMenuItem>
              </Link>
            ))}
        </DropdownMenuGroup>
        {roleRoutes.some((route) => route.id === PageEnum.SETTINGS) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <Link href="/settings?tab=account" passHref>
                <DropdownMenuItem disabled>
                  Account
                  <DropdownMenuShortcut>⇧⌘F</DropdownMenuShortcut>
                </DropdownMenuItem>
              </Link>
              <Link href="/settings?tab=billing" passHref>
                <DropdownMenuItem disabled>
                  Billing
                  <DropdownMenuShortcut>⇧⌘L</DropdownMenuShortcut>
                </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          Log out
          <DropdownMenuShortcut>⇧⌘N</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
