import '../src/index.css'
import { Instrument_Serif, Inter } from 'next/font/google'

// Load Instrument Serif font
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-instrument',
})

// Load Inter font
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-inter',
})

function MyApp({ Component, pageProps }) {
  return (
    <main className={`${instrumentSerif.variable} ${inter.variable}`}>
      <Component {...pageProps} />
    </main>
  )
}

export default MyApp
