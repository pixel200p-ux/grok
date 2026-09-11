import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export function FilterMenu<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLUListElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const label = options.find((o) => o.id === value)?.label ?? value;

  function place() {
    const r = btn.current?.getBoundingClientRect();
    if (!r) return;
    const width = 160;
    const left = Math.min(Math.max(8, r.right - width), window.innerWidth - width - 8);
    const top = r.bottom + 4;
    setPos({ top, left });
  }

  useEffect(() => {
    if (!open) return;
    place();
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (btn.current?.contains(t) || menu.current?.contains(t)) return;
      setOpen(false);
    }
    function onWin() {
      place();
    }
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("resize", onWin);
    window.addEventListener("scroll", onWin, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("resize", onWin);
      window.removeEventListener("scroll", onWin, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btn}
        type="button"
        title="Nhấp đúp để đổi bộ lọc"
        onDoubleClick={() => {
          place();
          setOpen((v) => !v);
        }}
        className="min-h-10 rounded-md border border-border bg-card px-3 text-xs font-medium"
      >
        {label}
      </button>
      {open &&
        createPortal(
          <ul
            ref={menu}
            style={{ top: pos.top, left: pos.left, width: 160 }}
            className="fixed z-[80] max-h-[min(70vh,22rem)] overflow-y-auto rounded-lg border border-border bg-card py-1 shadow-[var(--shadow-card)]"
          >
            {options.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(o.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full px-3 py-2 text-left text-xs hover:bg-muted",
                    o.id === value && "bg-primary/10 font-medium text-primary",
                  )}
                >
                  {o.label}
                </button>
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </>
  );
}