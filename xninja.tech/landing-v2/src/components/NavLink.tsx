import Link from 'next/link'

export function NavLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="font-display inline-block rounded-lg px-2 py-1 text-lg text-slate-100 hover:bg-slate-100 hover:text-slate-900"
    >
      {children}
    </Link>
  )
}
