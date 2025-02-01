import React from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const NotFoundPage = () => {
  return (
    <div className="flex flex-col justify-center items-center h-screen gap-4">
      <Label className="text-xl">404 Page not Found</Label>
      <Button>
        <Link href="/">Go Home</Link>
      </Button>
    </div>
  );
};

export default NotFoundPage;
