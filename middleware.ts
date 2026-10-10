import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl
  if (url.pathname === '/pokemon-card' && url.searchParams.get('view') === 'collection') {
    return NextResponse.redirect(new URL('/pokemon-card/collection', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: '/pokemon-card',
}
