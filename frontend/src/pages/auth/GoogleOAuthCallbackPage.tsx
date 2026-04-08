import { useEffect } from "react";
import { useTheme } from "../../ThemeContext";

/**
 * Landing page for the Google OAuth2 implicit-flow popup.
 * Google redirects here with the id_token in the URL hash.
 * We relay it to the opener via postMessage and close the popup.
 */
export default function GoogleOAuthCallbackPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const hash = window.location.hash.slice(1); // strip leading '#'
    const params = new URLSearchParams(hash);
    const idToken = params.get("id_token");
    const error = params.get("error");

    if (window.opener) {
      window.opener.postMessage(
        { type: "google-oauth-callback", idToken, error },
        window.location.origin
      );
    }
    window.close();
  }, []);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: isDark ? "#0a0a0a" : "#ffffff",
        color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)",
        fontFamily: "sans-serif",
        fontSize: 14,
      }}
    >
      Completing sign in…
    </div>
  );
}