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
  title: 'מנהל כספים עסקי',
  description: 'ניהול הוצאות, הכנסות ותזרים מזומנים לעסק',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning className={heebo.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()` }} />
      </head>
      <body className="antialiased font-sans">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
