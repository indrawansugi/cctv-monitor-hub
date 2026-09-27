import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { useAuth } from "@/hooks/use-auth";
import { GlassBackground } from "@/components/GlassBackground";
import {
  ArrowRight,
  KeyRound,
  Loader2,
  Mail,
  UserX,
  Eye,
  EyeOff,
} from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback = "/dashboard",
) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );
  const [step, setStep] = useState<
    "signIn" | { email: string } | "passwordSignIn" | "signUp"
  >("passwordSignIn");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  // ── Email + password (local server friendly) ──────────────────────────────
  const handlePasswordAuth = async (
    event: React.FormEvent<HTMLFormElement>,
    flow: "signIn" | "signUp",
  ) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const name = (formData.get("name") as string) || undefined;

      await signIn("password", { email, password, ...(flow === "signUp" ? { name } : {}) });
      navigate(redirect);
    } catch (err) {
      console.error("Password sign-in error:", err);
      const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
      if (/InvalidAccountID|account.*not.*found|Unknown/i.test(message)) {
        setError("Email belum terdaftar. Silakan daftar terlebih dahulu.");
      } else if (/Secret|password/i.test(message)) {
        setError("Email atau password salah.");
      } else {
        setError(message);
      }
      setIsLoading(false);
    }
  };

  // ── Email OTP (cloud mode) ────────────────────────────────────────────────
  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      setStep({ email: formData.get("email") as string });
      setIsLoading(false);
    } catch (error) {
      console.error("Email sign-in error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to send verification code. Please try again.",
      );
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);

      navigate(redirect);
    } catch (error) {
      console.error("OTP verification error:", error);

      setError("Kode verifikasi yang Anda masukkan salah.");
      setIsLoading(false);

      setOtp("");
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      navigate(redirect);
    } catch (error) {
      console.error("Guest login error:", error);
      setError(
        `Gagal masuk sebagai tamu: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setIsLoading(false);
    }
  };

  const inputCls = "border-white/60 bg-white/60 text-sky-950 placeholder:text-sky-900/40";
  const outlineBtnCls = "border-white/60 bg-white/50 hover:bg-white/80";

  const isPasswordFlow = step === "passwordSignIn" || step === "signUp";

  return (
    <div className="relative flex min-h-screen flex-col">
      <GlassBackground />

      {/* Auth Content */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="flex h-full flex-col items-center justify-center">
          <Card className="glass-strong min-w-[350px] border-white/70 pb-0">
            {step === "signIn" ? (
              <>
                <CardHeader className="text-center">
                  <div className="flex justify-center">
                    <div
                      className="mb-4 mt-4 flex size-16 cursor-pointer items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-500 text-white shadow-lg shadow-sky-500/30 transition hover:scale-105"
                      onClick={() => navigate("/")}
                    >
                      <Mail className="size-8" />
                    </div>
                  </div>
                  <CardTitle className="text-xl text-sky-950">
                    Masuk dengan Email
                  </CardTitle>
                  <CardDescription>
                    Kode verifikasi akan dikirim ke email Anda
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleEmailSubmit}>
                  <CardContent>
                    <div className="relative flex items-center gap-2">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-sky-400" />
                        <Input
                          name="email"
                          placeholder="nama@contoh.com"
                          type="email"
                          className={inputCls}
                          disabled={isLoading}
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        variant="outline"
                        size="icon"
                        disabled={isLoading}
                        className={outlineBtnCls}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowRight className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {error && (
                      <p className="mt-2 text-sm text-rose-500">{error}</p>
                    )}

                    <div className="mt-4">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-sky-200/70" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-transparent px-2 text-sky-900/45">
                            Atau
                          </span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        className={`mt-4 w-full ${outlineBtnCls}`}
                        onClick={handleGuestLogin}
                        disabled={isLoading}
                      >
                        <UserX className="mr-2 h-4 w-4" />
                        Masuk sebagai Tamu
                      </Button>
                      <Button
                        type="button"
                        variant="link"
                        className="mt-1 w-full text-sky-600"
                        onClick={() => setStep("passwordSignIn")}
                      >
                        Kembali ke login email &amp; password
                      </Button>
                    </div>
                  </CardContent>
                </form>
              </>
            ) : step === "passwordSignIn" || step === "signUp" ? (
              <>
                <CardHeader className="text-center">
                  <div className="flex justify-center">
                    <div
                      className="mb-4 mt-4 flex size-16 cursor-pointer items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-500 text-white shadow-lg shadow-sky-500/30 transition hover:scale-105"
                      onClick={() => navigate("/")}
                    >
                      <KeyRound className="size-8" />
                    </div>
                  </div>
                  <CardTitle className="text-xl text-sky-950">
                    {step === "signUp" ? "Daftar Akun Baru" : "Masuk"}
                  </CardTitle>
                  <CardDescription>
                    {step === "signUp"
                      ? "Buat akun untuk Anda atau anggota tim Anda"
                      : "Gunakan email dan password tim Anda"}
                  </CardDescription>
                </CardHeader>
                <form
                  onSubmit={(e) =>
                    handlePasswordAuth(
                      e,
                      step === "signUp" ? "signUp" : "signIn",
                    )
                  }
                >
                  <CardContent className="flex flex-col gap-3">
                    {step === "signUp" && (
                      <div className="relative">
                        <UserX className="absolute left-3 top-3 h-4 w-4 text-sky-400" />
                        <Input
                          name="name"
                          placeholder="Nama lengkap"
                          className={`${inputCls} pl-9`}
                          disabled={isLoading}
                        />
                      </div>
                    )}
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-sky-400" />
                      <Input
                        name="email"
                        placeholder="nama@contoh.com"
                        type="email"
                        className={`${inputCls} pl-9`}
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-3 h-4 w-4 text-sky-400" />
                      <Input
                        name="password"
                        placeholder={
                          step === "signUp"
                            ? "Password (min. 8 karakter)"
                            : "Password"
                        }
                        type={showPassword ? "text" : "password"}
                        minLength={step === "signUp" ? 8 : undefined}
                        className={`${inputCls} pl-9 pr-10`}
                        disabled={isLoading}
                        required
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-3 text-sky-400 hover:text-sky-600"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {error && (
                      <p className="text-sm text-rose-500">{error}</p>
                    )}

                    <Button
                      type="submit"
                      className="mt-1 w-full bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-md shadow-sky-500/30 hover:from-sky-600 hover:to-cyan-600"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Memproses...
                        </>
                      ) : step === "signUp" ? (
                        <>
                          Daftar
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Masuk
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      disabled={isLoading}
                      onClick={() =>
                        setStep(step === "signUp" ? "passwordSignIn" : "signUp")
                      }
                    >
                      {step === "signUp"
                        ? "Sudah punya akun? Masuk"
                        : "Belum punya akun? Daftar"}
                    </Button>

                    <div className="relative mt-1">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-sky-200/70" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-transparent px-2 text-sky-900/45">
                          Atau
                        </span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className={`w-full ${outlineBtnCls}`}
                      onClick={handleGuestLogin}
                      disabled={isLoading}
                    >
                      <UserX className="mr-2 h-4 w-4" />
                      Masuk sebagai Tamu
                    </Button>
                    <Button
                      type="button"
                      variant="link"
                      className="-mt-1 w-full text-sky-600"
                      onClick={() => setStep("signIn")}
                    >
                      Login dengan kode email (OTP)
                    </Button>
                  </CardContent>
                </form>
              </>
            ) : (
              <>
                <CardHeader className="mt-4 text-center">
                  <CardTitle className="text-sky-950">Cek email Anda</CardTitle>
                  <CardDescription>
                    Kami mengirim kode ke {step.email}
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleOtpSubmit}>
                  <CardContent className="pb-4">
                    <input type="hidden" name="email" value={step.email} />
                    <input type="hidden" name="code" value={otp} />

                    <div className="flex justify-center">
                      <InputOTP
                        value={otp}
                        onChange={setOtp}
                        maxLength={6}
                        disabled={isLoading}
                        onKeyDown={(e) => {
                          if (
                            e.key === "Enter" &&
                            otp.length === 6 &&
                            !isLoading
                          ) {
                            const form = (e.target as HTMLElement).closest(
                              "form",
                            );
                            if (form) {
                              form.requestSubmit();
                            }
                          }
                        }}
                      >
                        <InputOTPGroup>
                          {Array.from({ length: 6 }).map((_, index) => (
                            <InputOTPSlot key={index} index={index} />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    {error && (
                      <p className="mt-2 text-center text-sm text-rose-500">
                        {error}
                      </p>
                    )}
                    <p className="mt-4 text-center text-sm text-sky-900/55">
                      Tidak menerima kode?{" "}
                      <Button
                        variant="link"
                        className="h-auto p-0 text-sky-600"
                        onClick={() => setStep("signIn")}
                      >
                        Coba lagi
                      </Button>
                    </p>
                  </CardContent>
                  <CardFooter className="flex-col gap-2">
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-md shadow-sky-500/30 hover:from-sky-600 hover:to-cyan-600"
                      disabled={isLoading || otp.length !== 6}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Memverifikasi...
                        </>
                      ) : (
                        <>
                          Verifikasi kode
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setStep("signIn")}
                      disabled={isLoading}
                      className="w-full"
                    >
                      Gunakan email lain
                    </Button>
                  </CardFooter>
                </form>
              </>
            )}

            <div className="rounded-b-xl border-t border-white/60 bg-white/45 px-6 py-4 text-center text-xs text-sky-900/55">
              Diamankan oleh{" "}
              <a
                href="https://freebuff.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline transition-colors hover:text-sky-600"
              >
                freebuff.com
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
