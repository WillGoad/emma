import { AccessibleData, DataProduct } from "@/lib/types";
import { CSVLink } from "react-csv";

const convertTableToCsv = (
  dashboardData: AccessibleData,
  filterDataProducts: any,
) => {
  // CSV Header (including hidden columns that might not be visible on smaller screens)
  const headers = [
    "Name",
    "Status",
    "Price",
    "Description",
    "Organisation",
    "URL",
  ];

  // CSV Body (transform dataProducts into arrays)
  const rows = dashboardData?.dataProductsTableData
    ?.filter(filterDataProducts)
    ?.map((product: DataProduct) => [
      product.name,
      product.status,
      product?.price, // Format the price with $
      product?.description, // Handle null/undefined descriptions
      product?.organisation, // Organisation name
      product.accessURL, // URL, handle missing URLs
    ]);

  if (!rows) {
    return [headers];
  }
  // Combine headers and rows
  return [headers, ...rows];
};

type DataProductCSVExportProps = {
  dashboardData: AccessibleData;
  filterDataProducts: any;
  children: React.ReactNode;
};
export const DataProductCSVExport = ({
  dashboardData,
  filterDataProducts,
  children,
}: DataProductCSVExportProps) => {
  if (!dashboardData?.dataProductsTableData) {
    return null;
  }
  const csvData = convertTableToCsv(dashboardData, filterDataProducts);

  return (
    <CSVLink data={csvData} target="_blank" filename="data-products.csv">
      {children}
    </CSVLink>
  );
};
