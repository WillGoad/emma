import { useParams } from "next/navigation";
import NotFoundPage from "../../404-page/404-page";
import { ProductDetailsForm } from "../forms/productDetailsForm";

type ProductDetailsProps = {
  dataProducts: any[] | undefined;
};

const ProductDetails = ({ dataProducts }: ProductDetailsProps) => {
  const params = useParams();
  
  const product = dataProducts?.find(
    (product) => product.id === params.objectId,
  );
  if (!product) {
    return <NotFoundPage />;
  }

  return (
    <div className="mr-8 max-h-[90%] overflow-auto">
      <h1 className="mb-8">Product Details</h1>
      <ProductDetailsForm productData={product} />
    </div>
  );
};

export default ProductDetails;
