// components/account.tsx
"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/hooks/use-toast";
import { useUserData } from "@/components/context/UserContext";

export const Account = () => {
  const { toast } = useToast();
  const { user } = useUserData();

  const handleForgotPassword = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/user/auth/send-password-reset-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: user.email }), // Replace with actual user email
        }
      );

      if (response.ok) {
        toast({
          title: "Email Sent",
          description: "Password reset instructions sent to your email",
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reset email",
        duration: 5000,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Password Reset</h4>
        <p className="text-sm text-muted-foreground">
          Send a Password Reset link to your email
        </p>
        <Button onClick={handleForgotPassword}>Reset Password</Button>
      </div>
      
    </div>
  );
};