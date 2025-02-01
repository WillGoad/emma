"use client";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/components/hooks/use-toast";
import { createAPIKey, revokeAPIKey } from "@/lib/api/api-utils";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { copyToClipboard, formatSeconds } from "@/lib/utils";
import { useUserData } from "@/components/context/UserContext";

const credentialsFormSchema = z.object({
  ttl: z
    .number()
    .int()
    .positive()
    .max(365 * 24 * 60 * 60, "TTL cannot exceed 1 year")
    .default(60 * 60 * 24 * 30),
});

type CredentialsFormValues = z.infer<typeof credentialsFormSchema>;

// This can come from your database or API.
const defaultValues: Partial<CredentialsFormValues> = {
  ttl: 60 * 60 * 24 * 30,
};

export function CredentialsForm() {
  const { keyAuth } = useUserData();
  const { toast } = useToast();

  const [isDisabled] = useState<boolean>(false);

  const form = useForm<CredentialsFormValues>({
    resolver: zodResolver(credentialsFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const onSubmit = async (data: CredentialsFormValues) => {
    try {
      const response = await createAPIKey(data.ttl);
      if (response?.isSuccess) {
        toast({
          title: "Success! 🎉",
          description: "Your new API Key has been created.",
        });
      } else {
        toast({
          title: "Error! 😢",
          description: "An error occurred while creating your API Key.",
        });
      }
    } catch (error) {
      toast({
        title: "Error! 😢",
        description: "An error occurred while creating your API Key.",
      });
    }
  };

  const handleRevoke = async () => {
    // Revoke the API Key
    let response;
    if (!keyAuth) {
      return;
    }
    try {
      response = await revokeAPIKey(keyAuth.id);
      if (response?.isSuccess) {
        toast({
          title: "Success! 🎉",
          description: "Your API Key has been revoked.",
        });
      } else {
        toast({
          title: "Error! 😢",
          description: "An error occurred while revoking your API Key.",
        });
      }
    } catch (error) {
      toast({
        title: "Error! 😢",
        description: "An error occurred while revoking your API Key.",
      });
    }
  };

  return (
    <Form {...form}>
      <Label>Your API Key</Label>
      {keyAuth && keyAuth.key ? (
        keyAuth.ttl && keyAuth.ttl > 0 ? (
          <div className="flex items-center gap-3 flex-wrap">
            <pre className="mt-2 w-fit rounded-md bg-slate-950 p-4 group whitespace-pre-wrap break-words overflow-auto">
              <code className="text-slate-950 group-hover:text-white group-active:text-white ease-linear">
                {keyAuth.key}
              </code>
            </pre>
            <code className="text-sm text-gray-500">
              Expires in {formatSeconds(keyAuth.ttl)}
            </code>
            <Button
              variant={"outline"}
              disabled={!keyAuth.key}
              onClick={() => keyAuth.key && copyToClipboard(keyAuth.key, toast)}
            >
              Copy
            </Button>
            <Button
              variant={"destructive"}
              disabled={!keyAuth.key}
              onClick={handleRevoke}
            >
              Revoke
            </Button>
          </div>
        ) : (
          <code className="text-sm text-gray-500">
            API Key expired. Create a new one below
          </code>
        )
      ) : (
        <code className="text-sm text-gray-500">
          No API Key yet. Create one below.
        </code>
      )}
      <Label>Create a new Key</Label>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="ttl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Time to Expiry (Seconds)</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormDescription>
                This is how long until your API Key will expire. Keep it low to
                maximise security. Default is 30 days.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isDisabled}>
          Create new API Key
        </Button>
      </form>
    </Form>
  );
}
