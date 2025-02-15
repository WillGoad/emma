"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ClipboardList } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "../hooks/use-toast";
import { useUserData } from "../context/UserContext";
import { Button } from "../ui/button";
import { DataProduct, PricingMode } from "@/lib/types";
import { copyToClipboard } from "@/lib/utils";

interface DataSetCardProps {
  product: DataProduct;
  isSubscribed: boolean;
  openSubscribeSheet: (productID: string) => void;
}

const DataSetCard = ({
  product,
  isSubscribed,
  openSubscribeSheet,
}: DataSetCardProps) => {
  const { user, keyAuth } = useUserData();
  const [isSubscribedUI, setIsSubscribedUI] = useState(isSubscribed);
  const { toast } = useToast();

  useEffect(() => {
    setIsSubscribedUI(isSubscribed);
  }, [isSubscribed]);

  const handleToggleSubscription = async () => {
    if (!user) {
      setIsSubscribedUI(false);
      toast({
        title: "Error! 😢",
        description: "Please login to subscribe.",
      });
    } else {
      openSubscribeSheet(product.id);
    }
  };

  return (
    <Card className="flex p-2 bg-white items-center justify-between sm:flex-col flex-col">
      <CardHeader className="flex-1 sm:p-6 p-1">
        <Badge variant="outline" className="w-fit">
          {product.pricingMode === PricingMode.FREE ? "Free" : "Paid"}
        </Badge>
        <CardTitle className="text-2xl">
          <Link href={`/data-product/${product.id}`}>{product.name}</Link>
        </CardTitle>
        <p className="text-sm text-muted-foreground font-light">
          <Link
            href={`/organisation/${product.organisationID}`}
            className="flex gap-2"
          >
            {product.organisation.logoUrl ? (
              <Image
                src={product.organisation.logoUrl}
                alt="Logo"
                width={20}
                height={20}
              />
            ) : null}
            {product.organisation.name}
          </Link>
        </p>
        <CardDescription className="mt-2">
          {product.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {(product.pricingMode === PricingMode.FREE ||
          (isSubscribed && keyAuth)) && (
          <div className="flex w-full max-w-sm items-center space-x-2">
            <Input
              type="email"
              placeholder={`https://data.emmadata.org/${product.organisation.shortName}/${product.accessURL}?apikey=${keyAuth?.key}`}
              readOnly
            />
            <Button
              type="submit"
              onClick={() =>
                copyToClipboard(
                  `https://data.emmadata.org/${product.organisation.shortName}/${product.accessURL}?apikey=${keyAuth?.key}`,
                  toast
                )
              }
            >
              <ClipboardList />
            </Button>
          </div>
        )}
      </CardContent>
      {product.pricingMode !== PricingMode.FREE && (
        <CardFooter>
          <button onClick={handleToggleSubscription}>
            {isSubscribedUI ? "Unsubscribe" : "Subscribe"}
          </button>
        </CardFooter>
      )}
    </Card>
  );
};

export default DataSetCard;
