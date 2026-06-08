import type { Metadata } from 'next'
import { Heebo } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-heebo',
})

export const metadata: Metadata = {
  title: 'Luma Manager',
  description: 'ניהול הוצאות, הכנסות ותזרים מזומנים לעסק',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Luma Manager',
  },
  icons: {
    apple: '/icons/icon-180x180.png',
    icon: '/icons/icon-192x192.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning className={heebo.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{if(localStorage.getItem('theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}})()` }} />
        <meta name="theme-color" content="#3b1a08" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased font-sans">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
