import { getCookie } from "cookies-next";
import { USER_TOKEN } from "../constants";
import { DataProduct } from "../types";
import { ProfileFormValues } from "@/components/admin/forms/productDetailsForm";

type FormDataKeys = keyof ProfileFormValues;

export const updateDataProduct = async (
  productData: DataProduct,
  formData: ProfileFormValues,
) => {
  const token = await getCookie(USER_TOKEN);
  if (!token) return;

  const updatedFields: Partial<ProfileFormValues> = {};

  (Object.keys(formData) as FormDataKeys[]).forEach((key) => {
    if (formData[key] !== String(productData[key as keyof DataProduct])) {
      updatedFields[key] = formData[key];
    }
  });

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/data-products/update`,
    {
      method: "POST",
      headers: {
        "x-access-token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...updatedFields, id: productData.id }),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to update product: ${response.statusText}`);
  }

  return response.json();
};

export const newDataProduct = async (formData: ProfileFormValues) => {
  const token = await getCookie(USER_TOKEN);
  if (!token) return;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const response = await fetch(`${apiUrl}/data-products/create`, {
    method: "POST",
    headers: {
      "x-access-token": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...formData }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update product: ${response.statusText}`);
  }

  return response.json();
};
