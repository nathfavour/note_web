import { JetBrains_Mono } from "next/font/google";
import "../globals.css";
import { Providers } from "@/components/Providers";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={mono.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.kylrix.space" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.kylrix.space" />

        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var p = localStorage.getItem('kylrix_pulse_v1');
              if (p) {
                var d = JSON.parse(p);
                window.__KYLRIX_PULSE__ = d;
                document.documentElement.setAttribute('data-kylrix-pulse', 'true');
                var s = document.createElement('style');
                s.innerHTML = '[data-kylrix-pulse="true"] #navbar-launch-btn { display: none !important; }';
                document.head.appendChild(s);
              }
            } catch(e) {}
          })();
        `}} />

        <link 
          href="https://api.fontshare.com/v2/css?f[]=clash-display@200,300,400,500,600,700&f[]=satoshi@300,400,500,700,900&display=swap" 
          rel="stylesheet" 
        />
        <link rel="preconnect" href="https://fra.cloud.appwrite.io" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
