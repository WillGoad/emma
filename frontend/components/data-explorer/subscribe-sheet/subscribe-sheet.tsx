import { useUserData } from "@/components/context/UserContext";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PricingMode } from "@/lib/types";

interface SubscribeSheetProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  productID: string;
}

const SubscribeSheet = ({ open, setOpen, productID }: SubscribeSheetProps) => {
  const { user, dataProducts, organisations = [] } = useUserData();
  const isSubscribed = user?.subscriptions?.includes(productID);
  const product = dataProducts?.find((product) => product.id === productID);
  console.log(user, dataProducts, organisations);
  return (
    <Sheet open={!!productID && open} onOpenChange={setOpen}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isSubscribed ? "Cancel your subscription" : "Confirm your subscription"}</SheetTitle>
          <SheetDescription>
            {product?.name}
            {product?.description}
            {product?.pricingMode === PricingMode.FREE && "This product is free, subscribe to get data."}
            {product?.pricingMode === PricingMode.SUBSCRIPTION && "Charges for this product will be deducted from your account balance hourly or when you unsubscribe."}
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
};

export default SubscribeSheet;
