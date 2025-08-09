import Navigation from './components/Navigation'
import Footer from './components/Footer'
import './globals.css'

export const metadata = {
  title: 'Beluga League',
  description: 'The official site of the Beluga Rocket League community',
}

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 text-white">
        <Navigation />
        <main className="relative">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
