import Navigation from './components/Navigation'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import NotificationBar from './components/NotificationBar'
import './globals.css'

export const metadata = {
  title: 'Beluga League',
  description: 'The official site of the Beluga Rocket League community',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export const themeColor = '#1e40af'

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white overflow-x-hidden">
        <NotificationBar message="Standings and Power Rankings are now available for all divisions! (Season 7, 2025)" />
        <Navigation />
        <main className="relative">
          {children}
        </main>
        <Footer />
        
        {/* Back to top button component */}
        <ScrollToTop />
      </body>
    </html>
  )
}
