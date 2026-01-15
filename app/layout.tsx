import type React from "react"
import { ClerkProvider } from "@clerk/nextjs"
import { Inter } from "next/font/google"
import "./globals.css"
import { Metadata } from "next"

const inter = Inter({ subsets: ["latin"] })

export const metadata : Metadata = {
  title: "Code Arena - Multiplayer Coding Competitions",
  description: "Compete in real-time coding challenges. Join multiplayer coding battles with instant feedback and smart scoring.",
  keywords: "coding, competition, multiplayer, programming, challenges, real-time",
  authors: [{ name: "Code Arena Team" }],
  creator: "Code Arena",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://codearena.com",
    title: "Code Arena - Multiplayer Coding Competitions",
    description: "Compete in real-time coding challenges",
    siteName: "Code Arena",
  },
  twitter: {
    card: "summary_large_image",
    title: "Code Arena - Multiplayer Coding Competitions",
    description: "Compete in real-time coding challenges",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: "#2563eb",
        },
      }}
    >
      <html lang="en">
        <body className={inter.className}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
