import { describe, it, expect } from 'vitest'
import { isTokenExpired } from './client'

describe('isTokenExpired', () => {
  it('returns true for null or empty token', () => {
    expect(isTokenExpired(null)).toBe(true)
    expect(isTokenExpired('')).toBe(true)
  })

  it('returns false for token without exp (legacy key)', () => {
    const legacyToken = 'not-a-jwt'
    expect(isTokenExpired(legacyToken)).toBe(false)
  })

  it('returns true when token exp is in the past', () => {
    const past = Math.floor(Date.now() / 1000) - 60
    const payload = btoa(JSON.stringify({ exp: past }))
    const token = `header.${payload}.sig`
    expect(isTokenExpired(token)).toBe(true)
  })

  it('returns false when token exp is in the future', () => {
    const future = Math.floor(Date.now() / 1000) + 3600
    const payload = btoa(JSON.stringify({ exp: future }))
    const token = `header.${payload}.sig`
    expect(isTokenExpired(token)).toBe(false)
  })
})
