import '@testing-library/jest-dom'

// Mock next/router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    }
  },
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession() {
    return {
      data: null,
      status: 'unauthenticated',
    }
  },
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

// Mock Stripe
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve(null)),
}))

// Mock Prisma Client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    partner: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    campaign: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    language: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    communication: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

global.fetch = jest.fn()

// Mock Web APIs for Node.js environment
if (typeof globalThis.Headers === 'undefined') {
  Object.defineProperty(globalThis, 'Headers', {
    value: class Headers {
      constructor(init) {
        this.map = new Map()
        if (init) {
          if (init instanceof Headers) {
            init.forEach((value, key) => this.set(key, value))
          } else if (Array.isArray(init)) {
            init.forEach(([key, value]) => this.set(key, value))
          } else if (typeof init === 'object') {
            Object.entries(init).forEach(([key, value]) => this.set(key, value))
          }
        }
      }
      get(key) { return this.map.get(key.toLowerCase()) }
      set(key, value) { this.map.set(key.toLowerCase(), String(value)) }
      has(key) { return this.map.has(key.toLowerCase()) }
      append(key, value) { 
        const existing = this.get(key)
        this.set(key, existing ? `${existing}, ${value}` : value)
      }
      delete(key) { this.map.delete(key.toLowerCase()) }
      forEach(callback) { this.map.forEach((value, key) => callback(value, key, this)) }
      keys() { return this.map.keys() }
      values() { return this.map.values() }
      entries() { return this.map.entries() }
      [Symbol.iterator]() { return this.entries() }
    },
    writable: true,
  })
}

if (typeof globalThis.Request === 'undefined') {
  Object.defineProperty(globalThis, 'Request', {
    value: class Request {
      constructor(input, init = {}) {
        this._url = typeof input === 'string' ? input : input.url
        this.method = init.method || 'GET'
        this.headers = new globalThis.Headers(init.headers)
        this._body = init.body || null
        this.cache = init.cache || 'default'
        this.credentials = init.credentials || 'same-origin'
        this.destination = init.destination || ''
        this.integrity = init.integrity || ''
        this.keepalive = init.keepalive || false
        this.mode = init.mode || 'cors'
        this.redirect = init.redirect || 'follow'
        this.referrer = init.referrer || 'about:client'
        this.referrerPolicy = init.referrerPolicy || ''
        this.signal = init.signal || null
      }
      
      get url() { return this._url }
      get body() { return this._body }
      get bodyUsed() { return false }
      
      async json() { 
        try {
          return JSON.parse(this._body || '{}')
        } catch {
          return {}
        }
      }
      async text() { return this._body || '' }
      async arrayBuffer() { return new ArrayBuffer(0) }
      async blob() { return new Blob([this._body || '']) }
      async formData() { return new FormData() }
      clone() { return new Request(this._url, { method: this.method, headers: this.headers, body: this._body }) }
    },
    writable: true,
  })
}

if (typeof globalThis.Response === 'undefined') {
  Object.defineProperty(globalThis, 'Response', {
    value: class Response {
      constructor(body, init = {}) {
        this._body = body
        this.status = init.status || 200
        this.statusText = init.statusText || 'OK'
        this.headers = new globalThis.Headers(init.headers)
        this.ok = this.status >= 200 && this.status < 300
        this.redirected = false
        this.type = 'basic'
        this.url = ''
      }
      
      get body() { return this._body }
      get bodyUsed() { return false }
      
      async json() { 
        try {
          return JSON.parse(this._body || '{}')
        } catch {
          return {}
        }
      }
      async text() { return this._body || '' }
      async arrayBuffer() { return new ArrayBuffer(0) }
      async blob() { return new Blob([this._body || '']) }
      async formData() { return new FormData() }
      clone() { return new Response(this._body, { status: this.status, statusText: this.statusText, headers: this.headers }) }
      
      static json(data, init = {}) {
        return new Response(JSON.stringify(data), { 
          ...init, 
          headers: { 'Content-Type': 'application/json', ...init.headers } 
        })
      }
    },
    writable: true,
  })
}

// Suppress console errors during tests unless explicitly testing for them
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})