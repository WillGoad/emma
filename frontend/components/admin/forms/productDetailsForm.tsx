"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/components/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataProduct } from "@/lib/types";
import { newDataProduct, updateDataProduct } from "@/lib/api/operations";
import { useUserData } from "@/components/context/UserContext";

const profileFormSchema = z.object({
  organisationID: z.string().optional(),
  name: z.string().min(1, {
    message: "Product name is required.",
  }),
  description: z.string().min(1, {
    message: "Product description is required.",
  }),
  accessURL: z.string(),
  upstreamURL: z.string(),
  status: z.string({
    required_error: "Please select a stauts.",
  }),
  price: z.string().optional(),
  currency: z
    .string()
    .min(1, {
      message: "Currency is required.",
    })
    .optional(),
  pricingMode: z.string({
    required_error: "Please select a mode.",
  }),
  organisation: z
    .string()
    .min(1, {
      message: "Organisation is required.",
    })
    .optional(),
  paymentInterval: z
    .string({
      required_error: "Please select an interval.",
    })
    .optional(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProductDetailsFormProps {
  productData?: DataProduct;
}

export function ProductDetailsForm({ productData }: ProductDetailsFormProps) {
  const { organisations } = useUserData();

  const { toast } = useToast();

  // This can come from your database or API.
  const defaultValues: Partial<ProfileFormValues> = {
    name: productData?.name || "",
    description: productData?.description || "",
    accessURL: productData?.accessURL || "",
    upstreamURL: productData?.upstreamURL || "",
    status: productData?.status || "",
    price: String(productData?.price || 0),
    currency: productData?.currency || "GBP",
    pricingMode: productData?.pricingMode || "FREE",
    paymentInterval: productData?.paymentInterval || "MONTHLY",
    organisation: productData?.organisation.id || "",
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: "onChange",
  });

  function onSubmit(data: ProfileFormValues) {
    data.organisationID = organisations?.find(
      (org) => org.id === data.organisation,
    ).id;
    delete data.organisation;
    if (productData) {
      updateDataProduct(productData, data);
    } else {
      newDataProduct(data);
    }
    toast({
      title: "You submitted the following values:",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {productData && (
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Product ID
            </label>
            <div className="form-control">
              <Input value={productData.id || ""} readOnly />
            </div>
            <p className="text-sm text-muted-foreground">
              This is the unique identifier for the product.
            </p>
          </div>
        )}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                This is the name for the data product.
              </FormDescription>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Description</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                This is a brief description for the data product.
              </FormDescription>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="accessURL"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Access URL Suffix</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                This will be appended to form:{" "}
                {`https://data.emmadata.org/${productData?.organisation.shortName || "org"}/${field.value}`}
              </FormDescription>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="upstreamURL"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Upstream URL</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                This is upstream URL that the service will proxy to.
              </FormDescription>
            </FormItem>
          )}
        />
        {productData && (
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Product Creation Time
            </label>
            <div className="form-control">
              <Input
                value={new Date(productData.createdAt).toLocaleString()}
                readOnly
              />
            </div>
            <p className="text-sm text-muted-foreground">
              This is the time that the product was created.
            </p>
          </div>
        )}
        {productData && (
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Last Updated Time
            </label>
            <div className="form-control">
              <Input
                value={new Date(productData.updatedAt).toLocaleString()}
                readOnly
              />
            </div>
            <p className="text-sm text-muted-foreground">
              This is the time that the product was last updated.
            </p>
          </div>
        )}
        {productData && (
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Organisation ID
            </label>
            <div className="form-control">
              <Input value={productData.organisation.id || ""} readOnly />
            </div>
            <p className="text-sm text-muted-foreground">
              This is the ID of the organiation that owns the product.
            </p>
          </div>
        )}
        {productData && (
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Organisation Name
            </label>
            <div className="form-control">
              <Input value={productData.organisation.name || ""} readOnly />
            </div>
            <p className="text-sm text-muted-foreground">
              This is the name of the organiation that owns the product.
            </p>
          </div>
        )}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue defaultValue={field.value} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="LIVE">LIVE</SelectItem>
                  <SelectItem value="DRAFT">DRAFT</SelectItem>
                  <SelectItem value="ARCHIVED">ARCHIVED</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Determines whether this data product is generally accessible,
                draft is for pre release, archive for long term post demise
                storage.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <>
          <h3 className="text-lg font-medium">Organisation</h3>
          <FormField
            control={form.control}
            name="organisation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organisation</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue defaultValue={field.value} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {organisations?.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Determines the organisation which owns this data product.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
        <h3 className="text-lg font-medium">Pricing</h3>

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                This is the price of the data product.
              </FormDescription>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                This is the currency of the data product.
              </FormDescription>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pricingMode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pricing Mode</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue defaultValue={field.value || "SUBSRIPTION"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="FREE">FREE</SelectItem>
                  <SelectItem value="SUBSCRIPTION">SUBSCRIPTION</SelectItem>
                  <SelectItem value="PAY_PER_GB">PAY_PER_GB</SelectItem>
                  <SelectItem value="PAY_PER_REQUEST">
                    PAY_PER_REQUEST
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Determines the mode of the pricing structure.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paymentInterval"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Interval</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue defaultValue={field.value || "MONTHLY"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="DAILY">DAILY</SelectItem>
                  <SelectItem value="WEEKLY">WEEKLY</SelectItem>
                  <SelectItem value="MONTHLY">MONTHLY</SelectItem>
                  <SelectItem value="YEARLY">YEARLY</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Determines the interval of the pricing structure, if
                subscription. Not used for other pricing modes.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {productData && <h3 className="text-lg font-medium">Kong Details</h3>}
        {productData && (
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Service Response Body
            </label>
            <div className="form-control max-w-[500px]">
              <pre className="whitespace-pre-wrap break-words">
                {JSON.stringify(
                  productData?.kongDetails?.serviceResponseBody,
                  null,
                  2,
                ) || ""}
              </pre>
            </div>
            <p className="text-sm text-muted-foreground">
              This is the raw response from the kong admin API about the
              service.
            </p>
          </div>
        )}
        {productData && (
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Route Response Body
            </label>
            <div className="form-control max-w-[500px]">
              <pre className="whitespace-pre-wrap break-words">
                {JSON.stringify(
                  productData?.kongDetails?.routeResponseBody,
                  null,
                  2,
                ) || ""}
              </pre>
            </div>
            <p className="text-sm text-muted-foreground">
              This is the raw response from the kong admin API about the routes
              for the service.
            </p>
          </div>
        )}
        <Button type="submit">
          {productData ? "Update" : "Create"} Data Product
        </Button>
      </form>
    </Form>
  );
}
