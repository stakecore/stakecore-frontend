import { SigningKey, ripemd160, sha256 } from "ethers"
import { bech32 } from 'bech32'
import { HRP } from "../../constants"
import { Buffer } from 'buffer'


export function isHex(value: string): boolean {
  return /^(0x)?[A-F0-9]+$/i.test(value)
}

export function publicKeyToPAddress(network: string, pubk: string): string {
  const hrp = HRP[network]
  const compressed = SigningKey.computePublicKey(pubk, true)
  const address = ripemd160(sha256(compressed)).slice(2)
  const words = bech32.toWords(Buffer.from(address, 'hex'))
  const encoded = bech32.encode(hrp, words)
  return normalizePAddress(network, encoded)
}

export function normalizePAddress(network: string, pAddress: string): string {
  if (pAddress.startsWith('P-') || pAddress.startsWith('C-')) {
    pAddress = pAddress.slice(2)
  }
  if (isHex(pAddress)) {
    pAddress = pAddressToBech(network, pAddress)
  }
  return pAddress
}

export function pAddressToBech(network: string, pAddressHex: string): string {
  let hrp = HRP[network]
  return bech32.encode(hrp, bech32.toWords(Buffer.from(pAddressHex, 'hex')))
}
