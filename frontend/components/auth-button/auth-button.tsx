// components/AuthButton.tsx
import Link from "next/link";

import {
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

const AuthButton = () => {
  return (
    <NavigationMenuItem>
      <Link href="/login" legacyBehavior passHref>
        <NavigationMenuLink className={navigationMenuTriggerStyle()}>
          Log In
        </NavigationMenuLink>
      </Link>
    </NavigationMenuItem>
  );
};

export default AuthButton;
