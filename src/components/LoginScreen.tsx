import { authClient, authEnabled } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart3 } from "lucide-react";
import { useState } from "react";
import { useUiStore, type LoginThemeId } from "@/lib/ui-store";

const SKINS: { id: LoginThemeId; label: string; navy: string }[] = [
  { id: "aurora", label: "Navy", navy: "#0a2540" },
  { id: "midnight", label: "Midnight", navy: "#07111c" },
  { id: "ember", label: "Ember", navy: "#1c1410" },
  { id: "forest", label: "Forest", navy: "#0c2419" },
  { id: "pixel", label: "Steel", navy: "#132338" },
];

export function LoginScreen() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loginTheme = useUiStore((s) => s.loginTheme);
  const setLoginTheme = useUiStore((s) => s.setLoginTheme);

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
    <main className="login-stage grid min-h-dvh place-items-center p-4 sm:p-8" data-skin={loginTheme}>
      {/* Nút theme — góc trên phải */}
      <div className="absolute right-4 top-4 z-30 flex items-center gap-1.5 rounded-full border border-black/5 bg-white/80 p-1 shadow-sm backdrop-blur">
        {SKINS.map((t) => (
          <button
            key={t.id}
            type="button"
            title={t.label}
            aria-label={t.label}
            onClick={() => setLoginTheme(t.id)}
            className={`h-7 w-7 rounded-full border-2 transition ${
              loginTheme === t.id ? "scale-110 border-white ring-2 ring-[#0a2540]/40" : "border-white/80 hover:scale-105"
            }`}
            style={{ background: t.navy }}
          />
        ))}
      </div>

      <div className="login-card relative flex w-full max-w-[980px] overflow-hidden">
        {/* Trái: trắng */}
        <aside className="login-left relative hidden w-[46%] lg:block">
          <div className="login-left-mark" />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-10">
            <div className="login-mark-icon grid h-16 w-16 place-items-center rounded-2xl text-white shadow-lg">
              <BarChart3 className="h-8 w-8" />
            </div>
            <p className="login-kicker mt-8 text-[11px] font-semibold tracking-[0.55em]">WELCOME</p>
            <h2 className="login-title mt-3 text-center text-3xl font-semibold tracking-tight">
              Portfolio
              <span className="login-title-sub block font-normal">Manager</span>
            </h2>
            <p className="login-sub mt-3 text-center text-sm">Sổ cái danh mục · Trade T+</p>
          </div>
        </aside>

        {/* Phải: form + sóng cùng 1 màu */}
        <section className="login-panel relative z-20 flex w-full flex-col justify-center px-8 py-14 text-white sm:px-12 lg:w-[54%] lg:py-16 lg:pl-16 lg:pr-14">
          <div className="login-wave pointer-events-none absolute inset-y-0 right-full z-0 hidden w-[120px] lg:block" aria-hidden>
            <svg viewBox="0 0 120 800" preserveAspectRatio="none" className="h-full w-full">
              <path
                d="M18,0
                   C72,70  108,150  62,250
                   C8,360  110,430  58,540
                   C18,630  86,710  40,800
                   L120,800 L120,0 Z"
                fill="var(--login-navy)"
              />
            </svg>
          </div>
          <div className="login-orbs" aria-hidden />

          <div className="relative mx-auto w-full max-w-[340px] space-y-7">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/45">
                Portfolio Manager
              </p>
              <h1 className="mt-2 text-[1.85rem] font-semibold leading-snug tracking-tight">Xin chào!</h1>
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