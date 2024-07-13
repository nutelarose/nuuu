"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Provider } from "@supabase/supabase-js";
import config from "../../config";
import { toast } from "@/components/ui/use-toast";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoaderCircle } from "lucide-react";

export default function Login() {
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDisabled, setIsDisabled] = useState<boolean>(false);

  const handleSignup = async (
    e: any,
    options: {
      type: string;
      provider?: Provider;
    }
  ) => {
    e?.preventDefault();

    setIsLoading(true);

    try {
      const { type, provider } = options;
      const redirectURL = window.location.origin + "/api/auth/callback";

      if (type === "oauth" && provider) {
        await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: redirectURL,
          },
        });
      } else if (type === "magic_link") {
        await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: redirectURL,
          },
        });

        toast({
          title: "Magic link sent! Check your email.",
          className: "bg-green-500 text-white",
        });

        setIsDisabled(true);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if email is exactly "nutelarose@proton.me"
  const isEmailValid = email.trim().toLowerCase() === "nutelarose@proton.me";

  return (
    <main className="p-8 md:p-24">
      <h1 className="text-3xl text-slate-900 md:text-4xl font-bold tracking-tight text-center mb-12">
        Sign-in to {config.appName}
      </h1>

      <div className="space-y-8 max-w-xl mx-auto flex flex-col items-center justify-center">
        <form
          className="form-control w-full space-y-4"
          onSubmit={(e) => handleSignup(e, { type: "magic_link" })}
        >
          <Input
            required
            type="email"
            value={email}
            autoComplete="email"
            placeholder="example@domain.com"
            className="input input-bordered w-full placeholder:opacity-60 py-6"
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            className={buttonVariants({
              variant: "default",
              className:
                "flex justify-center items-center w-full gap-4 font-md py-6 hover:bg-gray-300",
            })}
            disabled={isLoading || isDisabled || !isEmailValid}
            type="submit"
          >
            {isLoading && <LoaderCircle className="animate-spin h-[60px]" />}
            Send Magic Link
          </button>
        </form>
      </div>
    </main>
  );
}
