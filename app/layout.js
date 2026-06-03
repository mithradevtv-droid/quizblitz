import './globals.css'
export const metadata = { title: 'QuizBlitz — Are You Dumb Enough?', description: 'Real-time multiplayer + solo quiz. Dark humor edition.' }
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
