import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "Devine | Salon Management System",
    template: "%s | Devine Salon",
  },
  description:
    "Devine is a modern salon management system to manage appointments, staff, services, billing, and customers بسهولة and efficiently.",

  keywords: [
    "Devine Salon",
    "Salon Management System",
    "Salon Software",
    "Appointment Booking",
    "Beauty Salon",
    "Spa Management",
  ],

  // authors: [{ name: "Devine Team" }],
  // creator: "Devine",
  // metadataBase: new URL("https://devine-salon.com"), // change to your real domain

  // openGraph: {
  //   title: "Devine | Smart Salon Management",
  //   description:
  //     "Manage your salon effortlessly with Devine – appointments, staff, services, and billing all in one place.",
  //   url: "https://devine-salon.com",
  //   siteName: "Devine Salon",
  //   images: [
  //     {
  //       url: "/og-image.png", // put your image in public folder
  //       width: 1200,
  //       height: 630,
  //       alt: "Devine Salon Management",
  //     },
  //   ],
  //   locale: "en_US",
  //   type: "website",
  // },

  // twitter: {
  //   card: "summary_large_image",
  //   title: "Devine | Salon Management System",
  //   description:
  //     "All-in-one salon management solution for modern businesses.",
  //   images: ["/og-image.png"],
  // },

  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">

        {children}

      </body>
    </html>
  );
}
