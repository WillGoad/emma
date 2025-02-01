import { ProductDetailsForm } from "../forms/productDetailsForm";

const ProductAddNew = () => {
  return (
    <div className="mr-8 max-h-[90%] overflow-auto">
      <h1 className="mb-8">Product Details</h1>
      <ProductDetailsForm />
    </div>
  );
};

export default ProductAddNew;
