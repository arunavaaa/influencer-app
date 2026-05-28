import { redirect } from 'next/navigation'

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const { role } = await searchParams
  if (role === 'brand') redirect('/onboarding/brand')
  if (role === 'creator') redirect('/onboarding/creator')
  redirect('/')
}
