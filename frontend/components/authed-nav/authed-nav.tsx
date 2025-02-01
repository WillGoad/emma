"use client";
import Link from "next/link";
import Image from "next/image";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { UserNav } from "@/components/user-nav/user-nav";
import { useUserData } from "../context/UserContext";
import { roleBasedRoutes } from "@/lib/route-config";
import { RouteConfig, UserRole } from "@/lib/types";
import AuthButton from "../auth-button/auth-button";

export const AuthedNav = () => {
  const { user } = useUserData();

  const roleRoutes: RouteConfig[] = roleBasedRoutes[user?.role as UserRole];

  return (
    <div className={user?.role !== UserRole.GUEST ? "border-b" : ""}>
      <div className="flex h-16 w-full items-center px-4">
        <NavigationMenu className="inline static max-w-full justify-start px-4 py-2 w-full max-w-full">
          <NavigationMenuList className="static w-full flex justify-between border-black">
            <div className="flex flex-row gap-4">
              <NavigationMenuItem>
                <Link href="/" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={`${navigationMenuTriggerStyle()}  gap-4 `}
                  >
                    <Image
                      src="/logodark.svg"
                      alt="Logo"
                      width={40}
                      height={40}
                    />
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              {roleRoutes
                .filter((route) => route.showInNav)
                .map((route) => (
                  <NavigationMenuItem
                    key={route.id}
                    className="hidden md:block"
                  >
                    <Link href={route.uri} legacyBehavior passHref>
                      <NavigationMenuLink
                        className={navigationMenuTriggerStyle()}
                      >
                        {route.label}
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                ))}
            </div>
            {user?.role === UserRole.GUEST ? <AuthButton /> : <UserNav />}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  );
};
