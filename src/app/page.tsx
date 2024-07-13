"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import config from "../../config";
import { Input } from "@/components/ui/input";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useToast } from "@/components/ui/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();
  }, [supabase]);

  const handleSignIn = async () => {
    setLoading(true);
    const { error, data: { user } = {} } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });
    if (error) {
      toast({
        title: "Falsche Email oder Passwort",
        description: "Bitte nochmal versuchen.",
        className: "bg-red-500 text-white",
      });
    } else {
      setUser(user);
      router.refresh();
      setEmail("");
      setPassword("");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  return (
    <main className="p-8 md:p-24 flex items-center flex-col">
      <h1 className="text-3xl text-slate-900 md:text-4xl font-bold tracking-tight text-center mb-12">
        Sign-in to {config.appName}
      </h1>
      <div className="bg-gray-50 p-8 rounded-lg shadow-md w-96 gap-2 grid ring-1 ring-slate-200">
        <Input
          required
          type="email"
          value={email}
          autoComplete="email"
          placeholder="example@domain.com"
          className="input input-bordered w-full placeholder:opacity-60 py-6 bg-white "
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="input input-bordered w-full placeholder:opacity-60 py-6 bg-white"
        />

        <Button
          onClick={handleSignIn}
          className="w-full p-3 rounded-md bg-gray-700 text-white hover:bg-gray-600 focus:outline-none mt-5"
        >
          
          Sign In
        </Button>
      </div>
    </main>
  );
}
