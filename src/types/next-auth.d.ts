import 'next-auth'
import 'next-auth/jwt'

// Allow CSS imports
declare module '*.css' {
  const content: Record<string, string>
  export default content
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
  }
}
