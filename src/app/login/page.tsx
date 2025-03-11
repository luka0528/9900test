"use client";

import { Separator } from "~/components/ui/separator";
import { getProviders, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { toast } from "sonner";
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
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string(),
});

export default function SignIn() {
  const [providers, setProviders] =
    useState<Awaited<ReturnType<typeof getProviders>>>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    localStorage.setItem("lastUsedEmail", values.email);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: values.email,
        password: values.password,
      });

      if (result?.error) {
        form.setError("email", { message: " " });
        form.setError("password", { message: " " });
        toast.error("Invalid email or password");
      } else {
        toast.success("Logged in successfully");
        router.push("/");
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("verify your email")
      ) {
        toast.error(error.message);
        router.push(
          `/verify-email?email=${encodeURIComponent(values.email)}`,
        );
      } else {
        toast.error("Something went wrong. Please try again.");
      }
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
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="********"
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
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

          <div className="flex w-80 items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground">
              Don&apos;t have an account?
            </span>
            <Link href="/sign-up">
              <Button
                variant="link"
                className="px-0 text-indigo-600"
              >
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden w-1/2 flex-col items-center justify-center gap-12 bg-gradient-to-b from-[#b2b6b6] to-[#6a6867] px-4 py-16 lg:flex"></div>
    </div>
  );
}
