"use client";

import { Separator } from "~/components/ui/separator";
import { getProviders, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { toast } from "sonner"
import { getProviderIcon, getProviderName } from "~/lib/icons";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export default function SignIn() {
  const [providers, setProviders] =
    useState<Awaited<ReturnType<typeof getProviders>>>(null);
  // const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchProviders = async () => {
      const providers = await getProviders();
      setProviders(providers);
    };
    void fetchProviders();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    // setAuthError(null);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: values.email,
        password: values.password,
      });

      if (result?.error) {
        // setAuthError("Invalid email or password");
        form.setError("email", { message: " " });
        form.setError("password", { message: " " });
        toast.error("Invalid email or password");
      } else {
        toast.success("Logged in successfully");
        router.push("/");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-screen justify-between bg-background">
      <div className="flex w-1/2 flex-col px-8 py-12">
        <div className="text-4xl font-bold">
          <h1>LOGO</h1>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-16">
          <div className="flex flex-col items-center gap-2">
            <h1 className="font-lustria text-2xl font-bold text-foreground">
              Log in to your account
            </h1>
            <h2 className="text-sm text-muted-foreground">
              Enter your email below to login to your account
            </h2>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex w-80 flex-col gap-4"
            >
              {/* {authError && (
                <div className="text-sm font-medium text-destructive">
                  {authError}
                </div>
              )} */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="m@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="mt-2 w-full"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </Form>

          <div className="flex w-80 items-center gap-2">
            <Separator className="flex-1" />
            <span className="text-sm text-muted-foreground">
              Or continue with
            </span>
            <Separator className="flex-1" />
          </div>

          <div className="flex w-full flex-col items-center gap-4">
            {providers &&
              Object.values(providers)
                .filter((provider) => provider.id !== "credentials")
                .map((provider) => (
                  <Button
                    key={provider.id}
                    variant="outline"
                    className="w-80 text-xs"
                    onClick={() =>
                      void signIn(provider.id, { callbackUrl: "/" })
                    }
                  >
                    {getProviderIcon(provider.id)}
                    Login with {getProviderName(provider.id)}
                  </Button>
                ))}
          </div>
        </div>
      </div>
      <div className="hidden w-1/2 flex-col items-center justify-center gap-12 bg-gradient-to-b from-[#b2b6b6] to-[#6a6867] px-4 py-16 lg:flex"></div>
    </div>
  );
}
