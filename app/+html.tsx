// @ts-nocheck
import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en" style={{ height: "100%" }}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <title>Sri Pooja Homam - Book Poojas, Homams & Live Darshan</title>
        <meta
          name="description"
          content="Sri Pooja Homam - India's trusted platform to book sacred poojas, homams, live temple darshan and temple accommodation with verified pujaris."
        />
        <meta name="theme-color" content="#7A3020" />
        <link rel="icon" href="/img/icon.png" />
        <link rel="apple-touch-icon" href="/img/icon.png" />

        {/* Open Graph — link previews (WhatsApp / Facebook / LinkedIn) */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Sri Pooja Homam" />
        <meta property="og:title" content="Sri Pooja Homam - Book Poojas, Homams & Live Darshan" />
        <meta
          property="og:description"
          content="India's trusted platform to book sacred poojas, homams, live temple darshan and temple accommodation with verified pujaris."
        />
        <meta property="og:url" content="https://sri.aatreya.org/" />
        <meta property="og:image" content="https://sri.aatreya.org/img/og.png" />

        {/* Twitter card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Sri Pooja Homam - Book Poojas, Homams & Live Darshan" />
        <meta
          name="twitter:description"
          content="India's trusted platform to book sacred poojas, homams, live temple darshan and temple accommodation with verified pujaris."
        />
        <meta name="twitter:image" content="https://sri.aatreya.org/img/og.png" />

        <ScrollViewStyleReset />
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              body > div:first-child { position: fixed !important; top: 0; left: 0; right: 0; bottom: 0; display: flex !important; flex-direction: column !important; }
              [role="tablist"] [role="tab"] * { overflow: visible !important; }
              [role="heading"], [role="heading"] * { overflow: visible !important; }
              * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
              *::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
            `,
          }}
        />
      </head>
      <body
        style={{
          margin: 0,
          height: "100%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </body>
    </html>
  );
}
