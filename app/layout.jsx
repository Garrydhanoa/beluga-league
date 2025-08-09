import Navigation from './components/Navigation'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import './globals.css'

export const metadata = {
  title: 'Beluga League',
  description: 'The official site of the Beluga Rocket League community',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  themeColor: '#1e40af',
}

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 text-white overflow-x-hidden">
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
