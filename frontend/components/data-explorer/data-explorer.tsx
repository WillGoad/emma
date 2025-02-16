import { DataProduct, FilterType, SearchInterfaceMode } from "@/lib/types";
import SearchInput from "../search-input/search-input";
import { useState } from "react";
import DataSetCard from "../data-set-sign/data-set-sign";
import { Separator } from "../ui/separator";
import FilterBar from "./filter-bar/filter-bar";
import { FiltersArray } from "@/lib/constants";
import { useUserData } from "../context/UserContext";
import SubscribeSheet from "./subscribe-sheet/subscribe-sheet";


export const DataExplorer = () => {
  const { user, dataProducts, organisations = [] } = useUserData();

  const [filter, setFilter] = useState<string>("all");
  const [open, setOpen] = useState<boolean>(false);
  const [subscribeSheetProductID, setSubscribeSheetProductID] = useState<string | null>(null);

  const openSubscribeSheet = (productID: string) => {
    setSubscribeSheetProductID(productID);
    setOpen(true);
  }

  const filterDataProducts = (product: DataProduct) => {
    if (filter === "all") return true;
    if (filter === "free") return product.pricingMode === "FREE";
    if (filter === "paid") return product.pricingMode !== "FREE";
    const organizationsContainFilter = organisations
      .map((org) => org.id)
      .includes(filter);
    if (organizationsContainFilter) return product.organisationID === filter;
    return true;
  };

  const dynamicFilters: FilterType[] = [
    ...FiltersArray,
    ...organisations.map((org) => ({
      id: org.id,
      image: org.logoUrl,
      label: org.name,
    })),
  ];
  return (
    <div className="h-fit flex flex-col items-center justify-center">
      <div className="h-fit mt-4 lg:w-3/6 w-5/6">
        <SearchInput mode={SearchInterfaceMode.INSET} />
      </div>
      <Separator className="my-5" />
      <FilterBar
        filters={dynamicFilters}
        onFilterChange={setFilter}
        activeFilter={filter}
      />
      {subscribeSheetProductID && <SubscribeSheet open={open} setOpen={setOpen} productID={subscribeSheetProductID} />}
      <div className="h-fit w-full mt-4 mb-12 px-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {dataProducts &&
            dataProducts
              .filter(filterDataProducts)
              .map((product: DataProduct) => (
                <DataSetCard
                  key={product.id}
                  product={product}
                  isSubscribed={
                    user?.subscriptions
                      ? user?.subscriptions.includes(product.id)
                      : false
                  }
                  openSubscribeSheet={openSubscribeSheet}
                />
              ))}
        </div>
      </div>
    </div>
  );
};
