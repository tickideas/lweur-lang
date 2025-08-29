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

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

global.fetch = jest.fn()

// Mock Web APIs
Object.defineProperty(global, 'Headers', {
  value: class Headers {
    constructor() {
      this.map = new Map()
    }
    get(key) { return this.map.get(key) }
    set(key, value) { this.map.set(key, value) }
    has(key) { return this.map.has(key) }
    append(key, value) { this.map.set(key, value) }
    delete(key) { this.map.delete(key) }
    forEach(callback) { this.map.forEach(callback) }
    keys() { return this.map.keys() }
    values() { return this.map.values() }
    entries() { return this.map.entries() }
  },
  writable: true,
})

Object.defineProperty(global, 'Request', {
  value: class Request {
    constructor(url, options = {}) {
      this.url = url
      this.method = options.method || 'GET'
      this.headers = new global.Headers(options.headers)
      this.body = options.body
    }
    json() { return Promise.resolve(JSON.parse(this.body || '{}')) }
    text() { return Promise.resolve(this.body || '') }
  },
  writable: true,
})

Object.defineProperty(global, 'Response', {
  value: class Response {
    constructor(body, options = {}) {
      this.body = body
      this.status = options.status || 200
      this.headers = new global.Headers(options.headers)
    }
    json() { return Promise.resolve(JSON.parse(this.body || '{}')) }
    text() { return Promise.resolve(this.body || '') }
  },
  writable: true,
})

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