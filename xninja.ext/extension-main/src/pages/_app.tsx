import "@/styles/globals.css";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className="w-custom h-custom mx-auto overflow-hidden">
      <Component {...pageProps} />
    </div>
  );
}
