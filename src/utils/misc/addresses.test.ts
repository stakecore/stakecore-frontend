import { describe, it, expect } from 'vitest'
import { isHex, publicKeyToPAddress, normalizePAddress, pAddressToBech } from './addresses'

// Canonical SECP256K1 generator point. Public key for private key 0x..01;
// used as a deterministic test vector — anyone running these tests gets
// the same compressed point, so the bech32 output should also be stable.
const GENERATOR_PUBKEY_UNCOMPRESSED =
  '0x0479BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8'

describe('isHex', () => {
  it('accepts plain hex strings', () => {
    expect(isHex('deadbeef')).toBe(true)
    expect(isHex('DEADBEEF')).toBe(true)
    expect(isHex('123abc456DEF')).toBe(true)
  })

  it('accepts 0x-prefixed hex', () => {
    expect(isHex('0xdeadbeef')).toBe(true)
    expect(isHex('0xDEADBEEF')).toBe(true)
  })

  it('rejects non-hex characters', () => {
    expect(isHex('deadbeer')).toBe(false)      // 'r' isn't hex
    expect(isHex('ghijklmn')).toBe(false)
    expect(isHex('flare1xyz')).toBe(false)     // bech32 chars
  })

  it('rejects empty strings (the regex requires at least one hex char)', () => {
    expect(isHex('')).toBe(false)
  })
})

describe('publicKeyToPAddress', () => {
  // Stable, snapshot-style assertion: any change to the hashing /
  // bech32-encoding path is a regression. If the snapshot needs to
  // change intentionally, run `vitest -u`.
  it('derives the same bech32 address for the SECP256K1 generator across networks', () => {
    expect(publicKeyToPAddress('flare', GENERATOR_PUBKEY_UNCOMPRESSED))
      .toMatchInlineSnapshot(`"flare1w508d6qejxtdg4y5r3zarvary0c5xw7kc5mmvh"`)
    expect(publicKeyToPAddress('songbird', GENERATOR_PUBKEY_UNCOMPRESSED))
      .toMatchInlineSnapshot(`"songbird1w508d6qejxtdg4y5r3zarvary0c5xw7kdnngms"`)
    expect(publicKeyToPAddress('avalanche', GENERATOR_PUBKEY_UNCOMPRESSED))
      .toMatchInlineSnapshot(`"avax1w508d6qejxtdg4y5r3zarvary0c5xw7k0l6nk9"`)
  })

  it('emits the network HRP at the start of the encoding', () => {
    expect(publicKeyToPAddress('flare', GENERATOR_PUBKEY_UNCOMPRESSED)).toMatch(/^flare1/)
    expect(publicKeyToPAddress('songbird', GENERATOR_PUBKEY_UNCOMPRESSED)).toMatch(/^songbird1/)
    expect(publicKeyToPAddress('avalanche', GENERATOR_PUBKEY_UNCOMPRESSED)).toMatch(/^avax1/)
  })

  it('is deterministic — same public key produces the same address every call', () => {
    const a = publicKeyToPAddress('flare', GENERATOR_PUBKEY_UNCOMPRESSED)
    const b = publicKeyToPAddress('flare', GENERATOR_PUBKEY_UNCOMPRESSED)
    expect(a).toBe(b)
  })

  it('accepts a compressed public key and produces the same address as its uncompressed form', () => {
    const compressed = '0x0279BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798'
    expect(publicKeyToPAddress('flare', compressed))
      .toBe(publicKeyToPAddress('flare', GENERATOR_PUBKEY_UNCOMPRESSED))
  })
})

describe('normalizePAddress', () => {
  const flareBech = publicKeyToPAddress('flare', GENERATOR_PUBKEY_UNCOMPRESSED)

  it('strips the P- prefix', () => {
    expect(normalizePAddress('flare', `P-${flareBech}`)).toBe(flareBech)
  })

  it('strips the C- prefix', () => {
    expect(normalizePAddress('flare', `C-${flareBech}`)).toBe(flareBech)
  })

  it('passes a bare bech32 string through unchanged', () => {
    expect(normalizePAddress('flare', flareBech)).toBe(flareBech)
  })

  it('treats a hex string as a P-chain address payload and bech32-encodes it', () => {
    // 20-byte hex string (40 chars) — the ripemd160 output shape
    const hex = '0123456789abcdef0123456789abcdef01234567'
    const out = normalizePAddress('flare', hex)
    expect(out).toMatch(/^flare1/)
    // Must match the explicit bech32 conversion too
    expect(out).toBe(pAddressToBech('flare', hex))
  })
})

describe('pAddressToBech', () => {
  it('produces a network-specific HRP prefix', () => {
    const hex = '0123456789abcdef0123456789abcdef01234567'
    expect(pAddressToBech('avalanche', hex)).toMatch(/^avax1/)
    expect(pAddressToBech('flare', hex)).toMatch(/^flare1/)
    expect(pAddressToBech('songbird', hex)).toMatch(/^songbird1/)
  })
})
