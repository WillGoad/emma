"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { AccountIndicator } from "@/components/ui/account-indicator";

import { setUserCookies } from "@/lib/utils";
import { useToast } from "@/components/hooks/use-toast";
import { useUserData } from "@/components/context/UserContext";
import { mutate } from "swr";

export default function Signin() {
  // const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [currentTab, setCurrentTab] = useState("email"); //["email", "confirmation"]
  const router = useRouter();
  const { toast } = useToast();

  const onLogin = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/user/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        },
      );
      //If status code 200 then change tab
      if (response.status === 200) {
        toast({
          title: "Code Sent",
          description:
            "We sent a code to your email. Make sure to check your spam folder.",
          duration: 5000,
        });
        setCurrentTab("confirmation");
      }
    } catch (error) {
      toast({
        title: "Error sending code",
        description: String(error),
        duration: 5000,
      });
    }
  };

  const onVerifyAccount = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/user/auth/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code, email }),
        },
      );
      // If status code 200 then change tab
      if (response.status === 200) {
        toast({
          title: "Welcome back",
          description: "You are now signed in.",
          duration: 5000,
        });
        const data = await response.json();
        setUserCookies(data.accessToken);
        mutate("user");
        router.push("/");
      }
    } catch (error) {
      toast({
        title: "Error signing in",
        description: String(error),
        duration: 5000,
      });
    }
  };

  //Function for when the user clicks the send code button
  const onSendCode = () => {
    //Check email is valid
    if (email.includes("@") && email.includes(".") && email.length > 5) {
      onLogin();
    }
  };

  //Function for when user clicks submit Code button
  const onSubmitCode = () => {
    if (
      code.length === 6 &&
      email.includes("@") &&
      email.includes(".") &&
      email.length > 5
    ) {
      onVerifyAccount();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center gap-4">
        <Button
          asChild={true}
          variant="outline"
          role="combobox"
          className="w-[120px] justify-center gap-5"
        >
          <Link href="/onboarding">Sign up</Link>
        </Button>
        <Tabs
          activationMode="automatic"
          value={currentTab}
          className="w-[400px]"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger onClick={() => setCurrentTab("email")} value="email">
              Email
            </TabsTrigger>
            <TabsTrigger
              onClick={() => setCurrentTab("confirmation")}
              value="confirmation"
            >
              Confirm
            </TabsTrigger>
          </TabsList>
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardDescription>
                  Enter the email associated with your account. We&apos;ll send
                  you a code to confirm it&apos;s you.
                </CardDescription>
              </CardHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onSendCode();
                }}
              >
                <CardContent className="space-y-2">
                  <div className="space-y-1">
                    <div className="flex flex-col gap-2 items-start">
                      <Label className="pl-2" htmlFor="email">
                        Email
                      </Label>
                      <Input
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit">Send Code</Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          <TabsContent value="confirmation">
            <Card>
              <CardHeader>
                <CardDescription>
                  Enter the code we sent to your email. Make sure to check your
                  spam folder.
                </CardDescription>
              </CardHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onSubmitCode();
                }}
              >
                <CardContent className="space-y-2">
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2 items-start">
                      <Label className="pl-2" htmlFor="email">
                        Email
                      </Label>
                      <Input
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-2 items-start">
                      <Label className="pl-2" htmlFor="code">
                        Code
                      </Label>
                      <Input
                        id="code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit">Submit</Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
