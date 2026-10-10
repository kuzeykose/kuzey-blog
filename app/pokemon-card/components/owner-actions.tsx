import Link from 'next/link'

type OwnerLink = {
  href: string
  label: string
}

/** Local-dev collection tools. The scan page itself stays reachable in production. */
export const OWNER_LINKS: OwnerLink[] = [
  { href: '/pokemon-card/add', label: 'Add card' },
  { href: '/pokemon-card/scan', label: 'Scan' },
]

export function OwnerActions({
  writable,
  links = OWNER_LINKS,
}: {
  writable: boolean
  links?: readonly OwnerLink[]
}) {
  if (!writable || links.length === 0) return null

  return (
    <nav aria-label="Collection tools" className="flex items-center gap-3 text-sm">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-neutral-600 dark:text-neutral-400 underline decoration-neutral-400 dark:decoration-neutral-600 underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
