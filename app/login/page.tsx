import { SignIn } from '@clerk/nextjs'

export default function LoginPage() {
  return (
    <main className="min-h-screen w-full bg-[#050505] flex items-center justify-center">
      <SignIn />
    </main>
  )
}
