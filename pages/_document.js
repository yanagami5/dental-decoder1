import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Fonts are loaded via @import in globals.css */}
        {/* Tabler icons (search, arrow, check, etc.) */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css"
        />
        <meta name="theme-color" content="#f7f5f0" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#161614"  media="(prefers-color-scheme: dark)"  />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
