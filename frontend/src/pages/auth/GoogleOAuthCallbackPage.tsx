import { useEffect } from "react";

/**
 * Landing page for the Google OAuth2 implicit-flow popup.
 * Google redirects here with the id_token in the URL hash.
 * We relay it to the opener via postMessage and close the popup.
 */
export default function GoogleOAuthCallbackPage() {
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
        background: "#0a0a0a",
        color: "rgba(255,255,255,0.5)",
        fontFamily: "sans-serif",
        fontSize: 14,
      }}
    >
      Completing sign in…
    </div>
  );
}