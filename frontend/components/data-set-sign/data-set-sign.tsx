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
import { LoadingSpinner } from "../loading-spinner/loading-spinner";
import { handleSubscribe, handleUnsubscribe } from "@/lib/api/api-utils";
import { useUserData } from "../context/UserContext";
import { Button } from "../ui/button";
import { DataProduct, PricingMode } from "@/lib/types";
import { copyToClipboard } from "@/lib/utils";

interface DataSetCardProps {
  product: DataProduct;
  isSubscribed: boolean;
}

const DataSetCard = ({ product, isSubscribed }: DataSetCardProps) => {
  const { user, keyAuth } = useUserData();
  const [isSubscribedUI, setIsSubscribedUI] = useState(isSubscribed);
  const [isSubscribeLoading, setIsSubscribeLoading] = useState(false);
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
    }
    try {
      setIsSubscribeLoading(true);
      if (isSubscribedUI) {
        const response = await handleUnsubscribe(product.id);
        if (response?.ok) {
          setIsSubscribedUI(false);
        } else {
          toast({
            title: "Error! 😢",
            description: "An error occurred while unsubscribing.",
          });
        }
      } else {
        const response = await handleSubscribe(product.id);
        if (response?.ok) {
          setIsSubscribedUI(true);
        } else {
          toast({
            title: "Error! 😢",
            description: "An error occurred while subscribing.",
          });
        }
      }
      setIsSubscribeLoading(false);
    } catch (error) {
      setIsSubscribeLoading(false);
      toast({
        title: "Error! 😢",
        description: "An error occurred while changing subscription status.",
      });
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
        {isSubscribedUI && keyAuth && (
          <div className="flex w-full max-w-sm items-center space-x-2">
            <Input
              type="email"
              placeholder={`https://data.emmadata.org/${product.organisation.shortName}/${product.accessURL}?apikey=${keyAuth.key}`}
              readOnly
            />
            <Button
              type="submit"
              onClick={() =>
                copyToClipboard(
                  `https://data.emmadata.org/${product.organisation.shortName}/${product.accessURL}?apikey=${keyAuth.key}`,
                  toast,
                )
              }
            >
              <ClipboardList />
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {isSubscribeLoading === true ? (
          <LoadingSpinner />
        ) : (
          <button onClick={handleToggleSubscription}>
            {isSubscribedUI ? "Unsubscribe" : "Subscribe"}
          </button>
        )}
      </CardFooter>
    </Card>
  );
};

export default DataSetCard;
