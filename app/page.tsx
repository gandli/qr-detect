// app/page.tsx
import Camera from '@/components/Camera'

export default function Home() {
  return (
    <main className="flex flex-col justify-center items-center w-screen h-screen">
      <Camera />
    </main>
  )
}
