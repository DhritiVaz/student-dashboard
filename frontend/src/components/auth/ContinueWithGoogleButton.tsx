import { useCallback, useEffect, useRef, useState } from "react";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

type Props = {
  disabled?: boolean;
  /** True while parent is finishing login (e.g. API call after credential). */
  loading?: boolean;
  onCredential: (idToken: string) => void | Promise<void>;
};

function loadGoogleScript(): Promise<void> {
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

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

/** “Continue with Google” — loads GIS, opens account picker (One Tap / FedCM), returns JWT to `onCredential`. */
export function ContinueWithGoogleButton({
  disabled,
  loading,
  onCredential,
}: Props) {
  const cbRef = useRef(onCredential);
  cbRef.current = onCredential;

  const [gsiReady, setGsiReady] = useState(false);
  const [scriptError, setScriptError] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID?.trim()) return;

    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID.trim(),
          callback: (res) => {
            if (!res.credential) return;
            void Promise.resolve(cbRef.current(res.credential)).catch(() => {
              /* parent handles errors */
            });
          },
          auto_select: false,
          use_fedcm_for_prompt: true,
        });
        setGsiReady(true);
      })
      .catch(() => {
        if (!cancelled) setScriptError(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /** FedCM migration: do not use One Tap `PromptMomentNotification` display/skip APIs (deprecated). */
  const handleClick = useCallback(() => {
    if (disabled || loading || !CLIENT_ID?.trim() || !gsiReady) return;
    window.google?.accounts?.id.prompt();
  }, [disabled, loading, gsiReady]);

  if (!CLIENT_ID?.trim()) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          disabled
          className="w-full flex items-center justify-center gap-3 rounded-[10px] font-semibold border transition-colors
            border-white/[0.14] bg-white/[0.04] text-white/90 opacity-45 cursor-not-allowed"
          style={{ padding: "11px 14px", fontSize: 15, letterSpacing: "0.01em" }}
        >
          <GoogleMark className="w-[22px] h-[22px] shrink-0" />
          Continue with Google
        </button>
        <p className="text-xs text-center px-2" style={{ color: "rgba(255,255,255,0.35)" }}>
          Add <code className="text-[10px]">VITE_GOOGLE_CLIENT_ID</code> (same as backend{" "}
          <code className="text-[10px]">GOOGLE_CLIENT_ID</code>) to enable Google sign-in.
        </p>
      </div>
    );
  }

  if (scriptError) {
    return (
      <p className="text-xs text-center px-2" style={{ color: "rgba(255,255,255,0.45)" }}>
        Could not load Google sign-in. Check your connection or try again later.
      </p>
    );
  }

  const busy = Boolean(disabled || loading || !gsiReady);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={handleClick}
      className="w-full flex items-center justify-center gap-3 rounded-[10px] font-semibold border transition-colors
        border-white/[0.14] bg-white/[0.04] text-white/90
        hover:bg-white/[0.08] hover:border-white/25
        disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:bg-white/[0.04]"
      style={{ padding: "11px 14px", fontSize: 15, letterSpacing: "0.01em" }}
    >
      {loading ? (
        <>
          <span className="css-spinner" />
          Signing in with Google…
        </>
      ) : (
        <>
          <GoogleMark className="w-[22px] h-[22px] shrink-0" />
          Continue with Google
        </>
      )}
    </button>
  );
}
