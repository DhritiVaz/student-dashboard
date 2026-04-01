import { useEffect, useRef } from "react";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

type Props = {
  onCredential: (credential: string) => void;
  disabled?: boolean;
};

export function GoogleSignInButton({ onCredential, disabled }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const cbRef = useRef(onCredential);
  cbRef.current = onCredential;

  useEffect(() => {
    if (!CLIENT_ID?.trim() || !ref.current) return;

    let cancelled = false;
    const el = ref.current;

    function loadScript(): Promise<void> {
      return new Promise((resolve, reject) => {
        if (window.google?.accounts?.id) {
          resolve();
          return;
        }
        const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
        if (existing) {
          existing.addEventListener("load", () => resolve());
          existing.addEventListener("error", () => reject(new Error("Google script error")));
          return;
        }
        const s = document.createElement("script");
        s.src = "https://accounts.google.com/gsi/client";
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("Failed to load Google script"));
        document.head.appendChild(s);
      });
    }

    loadScript()
      .then(() => {
        if (cancelled || !ref.current || !window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (res) => {
            if (res.credential) cbRef.current(res.credential);
          },
          auto_select: false,
        });
        el.innerHTML = "";
        window.google.accounts.id.renderButton(el, {
          type: "standard",
          theme: "filled_black",
          size: "large",
          text: "continue_with",
          width: 380,
        });
      })
      .catch(() => {
        /* parent can show env hint */
      });

    return () => {
      cancelled = true;
      el.replaceChildren();
    };
  }, []);

  if (!CLIENT_ID?.trim()) {
    return (
      <p className="text-xs text-center px-2" style={{ color: "rgba(255,255,255,0.35)" }}>
        Add <code className="text-[10px]">VITE_GOOGLE_CLIENT_ID</code> to enable Google sign-in.
      </p>
    );
  }

  return (
    <div
      ref={ref}
      className={`flex justify-center w-full min-h-[44px] [&>div]:w-full ${disabled ? "opacity-40 pointer-events-none" : ""}`}
    />
  );
}
