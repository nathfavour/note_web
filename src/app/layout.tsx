import { JetBrains_Mono } from "next/font/google";
import "../globals.css";
import { Providers } from "@/components/Providers";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL('https://note.kylrix.space'),
  title: "Kylrix Note - High-End Note Taking",
  description: "Experience the next generation of note taking with Kylrix Note.",
  icons: {
    icon: '/logo/favicon.ico',
    apple: '/logo/apple-touch-icon.png',
  },
  openGraph: {
    images: ['/logo/og-image.png'],
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={mono.variable} suppressHydrationWarning>
      <head>
        {/* Instant API Handshake */}
        <link rel="preconnect" href="https://api.kylrix.space" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.kylrix.space" />

        {/* Pulse Bridge: Handshake LocalStorage to DOM instantly to kill FOUC */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var p = localStorage.getItem('kylrix_pulse_v1');
              if (p) {
                var d = JSON.parse(p);
                window.__KYLRIX_PULSE__ = d;
                document.documentElement.setAttribute('data-kylrix-pulse', 'true');
                // Inject instant style to hide Launch button before React loads
                var s = document.createElement('style');
                s.innerHTML = '[data-kylrix-pulse=\"true\"] #navbar-launch-btn { display: none !important; }';
                document.head.appendChild(s);
              }
            } catch(e) {}
          })();
        `}} />

        {/* THE KYLRIX SIGNATURE TRIO: Satoshi (Body) & Clash Display (Headings) */}
        <link 
          href="https://api.fontshare.com/v2/css?f[]=clash-display@200,300,400,500,600,700&f[]=satoshi@300,400,500,700,900&display=swap" 
          rel="stylesheet" 
        />
        <link rel="preconnect" href="https://fra.cloud.appwrite.io" />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
