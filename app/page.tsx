// app/page.tsx
// import Camera from '@/components/Camera'
import QRCodeScanner from '@/components/QRCodeScanner'

export default function Home() {
  return (
    <main className="flex flex-col justify-center items-center w-screen h-screen">
      <QRCodeScanner />
    </main>
  )
}
