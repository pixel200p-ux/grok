import { authClient, authEnabled } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart3 } from "lucide-react";
import { useState } from "react";

export function LoginScreen() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "up") {
        const { error: err } = await authClient.signUp.email({
          email,
          password,
          name: name || email,
        });
        if (err) throw new Error(err.message);
      } else {
        const { error: err } = await authClient.signIn.email({ email, password });
        if (err) throw new Error(err.message);
      }
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-stage grid min-h-dvh place-items-center p-4 sm:p-8">
      <div className="login-card relative flex w-full max-w-[980px] overflow-hidden">
        {/* ===== Trái: trắng xoá ===== */}
        <aside className="relative hidden w-[46%] bg-white lg:block">
          <div className="login-left-mark" />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-10">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#0a2540] text-white shadow-lg">
              <BarChart3 className="h-8 w-8" />
            </div>
            <p className="mt-8 text-[11px] font-semibold tracking-[0.55em] text-[#0a2540]/35">
              WELCOME
            </p>
            <h2 className="mt-3 text-center text-3xl font-semibold tracking-tight text-[#0a2540]">
              Portfolio
              <span className="block font-normal text-[#0a2540]/55">Manager</span>
            </h2>
            <p className="mt-3 text-center text-sm text-[#0a2540]/45">Sổ cái danh mục · Trade T+</p>
          </div>
        </aside>

        {/* ===== Đường uốn lượn (navy đè lên trắng) ===== */}
        <div className="login-wave pointer-events-none absolute inset-y-0 left-[38%] z-10 hidden w-[22%] lg:block" aria-hidden>
          <svg viewBox="0 0 120 800" preserveAspectRatio="none" className="h-full w-full">
            <path
              d="M18,0
                 C72,70  108,150  62,250
                 C8,360  110,430  58,540
                 C18,630  86,710  40,800
                 L120,800 L120,0 Z"
              fill="#0a2540"
            />
          </svg>
        </div>

        {/* ===== Phải: form navy ===== */}
        <section className="relative z-0 flex w-full flex-col justify-center bg-[#0a2540] px-8 py-14 text-white sm:px-12 lg:w-[54%] lg:py-16 lg:pl-24 lg:pr-16">
          <div className="login-orbs" aria-hidden />

          <div className="relative mx-auto w-full max-w-[340px] space-y-7">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/45">
                Portfolio Manager
              </p>
              <h1 className="mt-2 text-[1.85rem] font-semibold leading-snug tracking-tight">
                Xin chào!
              </h1>
              <p className="mt-1.5 text-[15px] text-white/70">Rất vui được gặp bạn :)</p>
            </div>

            {authEnabled ? (
              <>
                <form className="space-y-4" onSubmit={onEmail}>
                  {mode === "up" && (
                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-medium text-white/70">Tên</Label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Tên của bạn"
                        className="login-field"
                      />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-medium text-white/70">Email</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="Email"
                      className="login-field"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-medium text-white/70">Mật khẩu</Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="Mật khẩu"
                      className="login-field"
                    />
                  </div>

                  {error && <p className="text-sm text-red-300">{error}</p>}

                  <Button type="submit" disabled={busy} className="login-submit">
                    {busy ? "Đang xử lý..." : mode === "up" ? "Tạo tài khoản" : "Đăng nhập"}
                  </Button>
                </form>

                <button
                  type="button"
                  className="w-full text-center text-sm text-white/55 transition hover:text-white"
                  onClick={() => setMode(mode === "up" ? "in" : "up")}
                >
                  {mode === "up" ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký"}
                </button>
              </>
            ) : (
              <p className="text-sm text-white/60">Đăng nhập đang tắt.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}