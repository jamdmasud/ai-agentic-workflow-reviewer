import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { MantineProvider, ColorSchemeScript, createTheme } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'

const inter = Inter({ subsets: ['latin'] })

const theme = createTheme({
  components: {
    Container: {
      styles: {
        root: {
          backgroundColor: 'transparent',
        }
      }
    },
    Paper: {
      styles: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }
      }
    },
    Card: {
      styles: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }
      }
    },
    Select: {
      styles: {
        option: {
          color: 'var(--mantine-color-text)',
          '&[data-selected]': {
            color: 'var(--mantine-color-white)',
          },
          '&[data-hovered]': {
            color: 'var(--mantine-color-text)',
          }
        },
        dropdown: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }
      }
    }
  }
})

export const metadata: Metadata = {
  title: 'Ethos Service AI - Workflow Reviewer',
  description: 'AI-powered intelligent workflow analysis and optimization by Ethos Service',
  keywords: ['AI', 'workflow', 'analysis', 'optimization', 'ethos', 'service'],
  authors: [{ name: 'Ethos Service AI' }],
  creator: 'Ethos Service AI',
  publisher: 'Ethos Service AI',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-simple.svg', type: 'image/svg+xml', sizes: '16x16' }
    ],
    apple: '/icon-192.svg',
  },
  manifest: '/manifest.json',
  themeColor: '#667eea',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-simple.svg" type="image/svg+xml" sizes="16x16" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <meta name="theme-color" content="#667eea" />
      </head>
      <body className={inter.className}>
        <MantineProvider theme={theme} defaultColorScheme="light">
          <Notifications />
          {children}
        </MantineProvider>
      </body>
    </html>
  )
}