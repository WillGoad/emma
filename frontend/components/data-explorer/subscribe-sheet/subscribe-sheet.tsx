import { useUserData } from "@/components/context/UserContext";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { handleSubscribe, handleUnsubscribe } from "@/lib/api/api-utils";
import { PricingMode } from "@/lib/types";
import { useToast } from "../../hooks/use-toast";
import { Alert } from "@/components/ui/alert";

interface SubscribeSheetProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  productID: string;
}

// Helper functions
const getCurrencySymbol = (currency?: string) => {
  switch (currency?.toUpperCase()) {
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    default:
      return "";
  }
};

const formatInterval = (interval?: any) => {
  switch (interval) {
    case "HOURLY":
      return "hour";
    case "DAILY":
      return "day";
    case "WEEKLY":
      return "week";
    case "MONTHLY":
      return "month";
    case "YEARLY":
      return "year";
    default:
      return "interval";
  }
};

const getUserBalance = (balances: any[], currency?: string) => {
  if (!currency) return 0;
  return balances.find((b) => b.currency === currency)?.amount || 0;
};

const SubscribeSheet = ({ open, setOpen, productID }: SubscribeSheetProps) => {
  const { user, dataProducts, organisations = [] } = useUserData();
  const { toast } = useToast();
  const isSubscribed = user?.subscriptions?.includes(productID);
  const product = dataProducts?.find((product) => product.id === productID);
  console.log("USer: ", user);

  // Calculate hasSufficientBalance (use in your component logic)
  const hasSufficientBalance =
    product?.pricingMode === PricingMode.SUBSCRIPTION
      ? getUserBalance(user?.balances || [], product?.currency) >=
        (product?.price || 0)
      : true;

  const handleToggleSubscription = async () => {
    let response;
    if (isSubscribed) {
      response = await handleUnsubscribe(productID);
    } else {
      response = await handleSubscribe(productID);
    }
    if (response?.ok) {
      setOpen(false);
    } else {
      if (response) {
        const errorMessage = await response
          .json()
          .then((data) => data.message)
          .catch(() => "Failed to change subscription status.");
        toast && toast({ title: "Error! 😢", description: errorMessage });
      } else {
        toast &&
          toast({
            title: "Error! 😢",
            description: "Failed to change subscription status.",
          });
      }
    }
  };

  return (
    <Sheet open={!!productID && open} onOpenChange={setOpen}>
      <SheetContent className="sm:max-w-[425px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {isSubscribed ? "Cancel Subscription" : "Confirm Subscription"}
          </SheetTitle>

          <div className="text-sm text-muted-foreground space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">{product?.name}</h4>
              <p className="text-sm text-muted-foreground">
                {product?.description}
              </p>
            </div>
            {product?.pricingMode === PricingMode.SUBSCRIPTION && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-medium">
                    {getCurrencySymbol(product?.currency)}
                    {product?.price?.toFixed(2)}
                    <span className="ml-2 text-muted-foreground text-xs">
                      per {formatInterval(product?.paymentInterval)}
                    </span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Your Balance:</span>
                  <span className="font-medium">
                    {getCurrencySymbol(product?.currency)}
                    {(user?.balances &&
                      getUserBalance(
                        user?.balances,
                        product?.currency
                      )?.toFixed(2)) ||
                      "0.00"}
                  </span>
                </div>

                {!hasSufficientBalance && (
                  <Alert variant="destructive" className="mt-2">
                    Insufficient {product?.currency} balance. Please add funds
                    to subscribe.
                  </Alert>
                )}
              </div>
            )}
          </div>

          <SheetFooter>
            <Button
              variant="default"
              onClick={handleToggleSubscription}
              disabled={
                product?.pricingMode === PricingMode.SUBSCRIPTION &&
                !hasSufficientBalance
              }
            >
              {isSubscribed ? "Cancel Subscription" : "Confirm Subscription"}
            </Button>
          </SheetFooter>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
};

export default SubscribeSheet;
