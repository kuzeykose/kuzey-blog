'use server'

import { notFound, redirect } from 'next/navigation'
import { isDevOpen, ownerPassword, passwordsMatch, safeNext, setOwnerCookie } from '../lib/owner'

export async function unlockOwner(formData: FormData) {
  const next = safeNext(typeof formData.get('next') === 'string' ? formData.get('next') : undefined)
  if (isDevOpen()) redirect(next)
  if (!ownerPassword()) notFound()

  const submitted = typeof formData.get('password') === 'string' ? formData.get('password') : ''
  if (!passwordsMatch(submitted, ownerPassword())) {
    redirect(`/pokemon-card/unlock?next=${encodeURIComponent(next)}&error=1`)
  }

  await setOwnerCookie()
  redirect(next)
}
