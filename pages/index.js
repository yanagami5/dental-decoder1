import Head from "next/head";
import DentalDecoder from "../components/DentalDecoder";

export default function Home() {
  return (
    <>
      <Head>
        <title>MyDentistSaid — Free Dental Diagnosis Decoder</title>
        <meta
          name="description"
          content="Type any dental term or diagnosis and get a plain-English explanation with an AI-generated illustration showing exactly what's happening. Free dental decoder tool."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Open Graph — for sharing on social */}
        <meta property="og:title"       content="MyDentistSaid — Free Dental Diagnosis Decoder" />
        <meta property="og:description" content="Understand your dental diagnosis in plain English, with an AI illustration." />
        <meta property="og:type"        content="website" />
        <meta property="og:url"         content="https://mydenistsaid.com" />

        {/* Twitter card */}
        <meta name="twitter:card"        content="summary_large_image" />
        <meta name="twitter:title"       content="MyDentistSaid — Free Dental Decoder" />
        <meta name="twitter:description" content="Understand any dental diagnosis in plain English." />

        <link rel="icon" href="/favicon.ico" />
      </Head>

      <DentalDecoder />
    </>
  );
}
