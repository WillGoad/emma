import React, { useEffect, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandDialog,
} from "@/components/ui/command";
import { DataProduct, PricingMode, SearchInterfaceMode } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useUserData } from "../context/UserContext";
import { searchProducts } from "@/lib/search-utils";

function uniqueBy(arr: any[], field: string) {
  return arr.reduce((a, d) => {
    if (!a.includes(d[field])) {
      a.push(d[field]);
    }
    return a;
  }, []);
}

type CustomHitsProps = {
  hits: any[];
  setOpen?: (open: boolean) => void;
};

const CustomHits = ({ hits, setOpen }: CustomHitsProps) => {
  const { organisations = [] } = useUserData();

  console.log(hits);
  const router = useRouter();
  const organisationIDs = uniqueBy(hits, "organisationID");
  console.log("organisations", organisations);

  const handleItemClick = (hit: any) => {
    if (setOpen) setOpen(false);
    router.push(`/data-product/${hit.id}`);
  };

  return (
    <CommandList>
      {organisationIDs.map((organisationID: string, index: number) => (
        <React.Fragment key={organisationID}>
          <CommandGroup
            heading={
              organisations.find((org) => org.id === organisationID)?.name
            }
          >
            {hits
              .filter((hit) => hit.organisationID === organisationID)
              .map((hit) => (
                <CommandItem
                  key={hit.id}
                  onSelect={() => handleItemClick(hit)}
                  value={`${hit.name} (${hit.id})`}
                >
                  <div className="flex justify-between w-full border-black">
                    <span>{String(hit.name)}</span>
                    <span className="sr-only">ID: {hit.id}</span>
                    {hit.pricingMode === PricingMode.FREE ? (
                      <span>Free</span>
                    ) : hit.pricingMode === PricingMode.SUBSCRIPTION ? (
                      <span>
                        {hit.currency}
                        {String(hit.price)}/{hit.paymentInterval}
                      </span>
                    ) : hit.pricingMode === PricingMode.PAY_PER_GB ? (
                      <span>
                        {hit.currency}
                        {String(hit.price)}/GB
                      </span>
                    ) : hit.pricingMode === PricingMode.PAY_PER_REQUEST ? (
                      <span>
                        {hit.currency}
                        {String(hit.price)}/Request
                      </span>
                    ) : (
                      <span>POA</span>
                    )}
                  </div>
                </CommandItem>
              ))}
          </CommandGroup>
          {index !== organisationIDs.length - 1 && <CommandSeparator />}
        </React.Fragment>
      ))}

      {hits.length === 0 && <CommandEmpty>No results found.</CommandEmpty>}
    </CommandList>
  );
};

type SearchInputProps = {
  mode: SearchInterfaceMode;
  open?: boolean;
  setOpen?: (open: boolean) => void;
};

const SearchInput = ({ mode, open, setOpen }: SearchInputProps) => {
  const { dataProducts = [] } = useUserData();

  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<DataProduct[]>(dataProducts);
  const [hitsShown, setHitsShown] = useState(false);

  useEffect(() => {
    setHits(dataProducts);
  }, [dataProducts]);

  const handleSearch = (searchTerm: string) => {
    setQuery(searchTerm);
    const results = searchProducts(dataProducts, searchTerm);
    setHits(results);
  };

  switch (mode) {
    case SearchInterfaceMode.DIALOG:
      return (
        <CommandDialog open={open} onOpenChange={setOpen}>
          <Command>
            <CommandInput
              placeholder="Find market data products (⌘ K)"
              value={query}
              onValueChange={(search) => handleSearch(search)}
            />
            <CustomHits hits={hits} setOpen={setOpen} />
          </Command>
        </CommandDialog>
      );

    case SearchInterfaceMode.INSET:
      return (
        <div className="lg:w-3/6 w-5/6 h-12">
          <Command
            className="absolute rounded-lg border shadow-md h-auto max-h-96 z-10 lg:w-3/6 w-5/6"
            onFocus={() => setHitsShown(true)}
            onBlur={() => setHitsShown(false)}
          >
            <CommandInput
              placeholder="Find market data products"
              value={query}
              onValueChange={(search) => handleSearch(search)}
            />
            {hitsShown && <CustomHits hits={hits} />}
          </Command>
        </div>
      );

    default:
      return null;
  }
};

export default SearchInput;
