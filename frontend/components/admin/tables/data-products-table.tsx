import {
  ListFilter,
  MoreHorizontal,
  PlusCircle,
  Search,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { formatDate } from "@/lib/utils";
import { PricingMode } from "@/lib/types";

type DataProductsTableProps = {
  dataProducts: any[] | undefined;
};

const dataProductFilters = ["ALL", "LIVE", "DRAFT", "ARCHIVED"];

const DataProductsTable = ({ dataProducts }: DataProductsTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentFilter, setCurrentFilter] = useState("ALL");

  const filterDataProducts = (dataProduct: any) => {
    if (currentFilter === "ALL" || dataProduct.status === currentFilter) {
      if (searchTerm === "") return true;
      return dataProduct.name.toLowerCase().includes(searchTerm.toLowerCase());
    }

    return false;
  };
  return (
    <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 mr-12">
      <div className="flex flex-col justify-center max-w-full">
        <div className="flex items-center">
          <div className="mr-auto flex items-center gap-2">
            <div className="relative flex-1 md:grow-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <ListFilter className="h-3.5 w-3.5" />
                  <span className="sr-only lg:not-sr-only sm:whitespace-nowrap">
                    Filter
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {dataProductFilters.map((filter) => (
                  <DropdownMenuCheckboxItem
                    key={filter}
                    {...(filter === currentFilter && { checked: true })}
                    onClick={() => setCurrentFilter(filter)}
                  >
                    {filter}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {/* <DataProductCSVExport dashboardData={dashboardData} filterDataProducts={filterDataProducts}>
                            <Button size="sm" variant="outline" className="h-8 gap-1">
                                <File className="h-3.5 w-3.5" />
                                <span className="sr-only lg:not-sr-only sm:whitespace-nowrap">
                                    Export
                                </span>
                            </Button>
                        </DataProductCSVExport> */}
            <Link href="/operations/products/new">
              <Button size="sm" className="h-8 gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Add Product
                </span>
              </Button>
            </Link>
          </div>
        </div>
        <div className="mt-2 max-w-full w-full">
          <Card x-chunk="dashboard-06-chunk-0">
            <CardHeader>
              <CardTitle>Data Products</CardTitle>
              <CardDescription>Manage your data products.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto max-w-full">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Organisation ID</TableHead>
                    <TableHead>Organisation Name</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>CreatedAt</TableHead>
                    <TableHead>UpdatedAt</TableHead>
                    <TableHead>Pricing Mode</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Payment Interval</TableHead>
                    <TableHead>Subscriber Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataProducts?.filter(filterDataProducts).map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/operations/products/${product.id}`}>
                                View / Edit
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell>{product.id || "-"}</TableCell>
                      <TableCell className="font-medium">
                        {product.name || "-"}
                      </TableCell>
                      <TableCell>
                        {product.status ? (
                          <Badge variant="outline">{product.status}</Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>${product.description || "-"}</TableCell>
                      <TableCell>{product.organisation.id || "-"}</TableCell>
                      <TableCell>{product.organisation.name || "-"}</TableCell>
                      <TableCell>
                        {product.organisation.shortName && product.accessURL
                          ? `/${product.organisation.shortName}/${product.accessURL}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {formatDate(product.createdAt || "-")}
                      </TableCell>
                      <TableCell>
                        {formatDate(product.updatedAt || "-")}
                      </TableCell>
                      <TableCell>{product.pricingMode || "-"}</TableCell>
                      <TableCell>
                        {product.pricingMode !== PricingMode.FREE &&
                        product.currency
                          ? product.currency
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {product.pricingMode !== PricingMode.FREE &&
                        product.price
                          ? product.price
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {product.pricingMode === PricingMode.SUBSCRIPTION &&
                        product.paymentInterval
                          ? product.paymentInterval
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {(product.subscriptions &&
                          product.subscriptions.length) ||
                        (product.subscriptions &&
                          product.subscriptions.length === 0)
                          ? product.subscriptions.length
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <div className="text-xs text-muted-foreground">
                Showing <strong>{dataProducts?.length}</strong> products
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </main>
  );
};

export default DataProductsTable;
