import { useCallback, useRef } from "react";
import { useTheme } from "../../ThemeContext";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

type Props = {
  disabled?: boolean;
  /** True while parent is finishing login (e.g. API call after credential). */
  loading?: boolean;
  onCredential: (idToken: string) => void | Promise<void>;
};

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

/** Opens a proper Google OAuth2 popup window and resolves with an id_token. */
function openGoogleOAuthPopup(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "id_token",
      redirect_uri: `${window.location.origin}/auth/google/callback`,
      scope: "openid email profile",
      nonce,
      prompt: "select_account",
    });

    const width = 500;
    const height = 620;
    const left = Math.round(window.screenX + (window.outerWidth - width) / 2);
    const top = Math.round(window.screenY + (window.outerHeight - height) / 2);

    const popup = window.open(
      `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
      "google-signin",
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    if (!popup) {
      reject(new Error("Popup blocked. Allow popups for this site and try again."));
      return;
    }

    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "google-oauth-callback") return;
      cleanup();
      if (event.data.idToken) {
        resolve(event.data.idToken as string);
      } else {
        reject(new Error(event.data.error ?? "Google sign-in cancelled."));
      }
    }

    // Detect popup closed without completing sign-in
    const pollTimer = setInterval(() => {
      if (popup.closed) {
        cleanup();
        reject(new Error("Google sign-in cancelled."));
      }
    }, 500);

    function cleanup() {
      window.removeEventListener("message", onMessage);
      clearInterval(pollTimer);
    }

    window.addEventListener("message", onMessage);
  });
}

/** "Continue with Google" — opens a proper OAuth2 popup and returns an id_token to `onCredential`. */
export function ContinueWithGoogleButton({ disabled, loading, onCredential }: Props) {
  const cbRef = useRef(onCredential);
  cbRef.current = onCredential;

  const handleClick = useCallback(async () => {
    if (disabled || loading || !CLIENT_ID?.trim()) return;
    try {
      const idToken = await openGoogleOAuthPopup(CLIENT_ID.trim());
      await Promise.resolve(cbRef.current(idToken));
    } catch (err) {
      // Cancelled or blocked — parent doesn't need to know unless it's a real error
      const msg = (err as Error)?.message ?? "";
      if (msg && !msg.toLowerCase().includes("cancel")) {
        // Re-surface popup-blocked errors
        console.error("[Google sign-in]", msg);
      }
    }
  }, [disabled, loading]);

  const { theme } = useTheme();
  const isDark = theme === "dark";
  const btnBorder = isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.12)";
  const btnBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.8)";
  const btnTextColor = isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.8)";
  const btnHoverBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)";
  const btnHoverBorder = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.18)";
  const helperText = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)";

  if (!CLIENT_ID?.trim()) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          disabled
          className="w-full flex items-center justify-center gap-3 rounded-[10px] font-semibold border transition-colors opacity-45 cursor-not-allowed"
          style={{
            padding: "11px 14px",
            fontSize: 15,
            letterSpacing: "0.01em",
            borderColor: btnBorder,
            background: btnBg,
            color: btnTextColor,
          }}
        >
          <GoogleMark className="w-[22px] h-[22px] shrink-0" />
          Continue with Google
        </button>
        <p className="text-xs text-center px-2" style={{ color: helperText }}>
          Add <code className="text-[10px]">VITE_GOOGLE_CLIENT_ID</code> (same as backend{" "}
          <code className="text-[10px]">GOOGLE_CLIENT_ID</code>) to enable Google sign-in.
        </p>
      </div>
    );
  }

  const busy = Boolean(disabled || loading);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={handleClick}
      className="w-full flex items-center justify-center gap-3 rounded-[10px] font-semibold border transition-colors
        disabled:opacity-45 disabled:cursor-not-allowed"
      style={{
        padding: "11px 14px",
        fontSize: 15,
        letterSpacing: "0.01em",
        borderColor: btnBorder,
        background: btnBg,
        color: btnTextColor,
      }}
      onMouseEnter={(e) => {
        if (!busy) {
          e.currentTarget.style.background = btnHoverBg;
          e.currentTarget.style.borderColor = btnHoverBorder;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = btnBg;
        e.currentTarget.style.borderColor = btnBorder;
      }}
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