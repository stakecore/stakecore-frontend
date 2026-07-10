// A link cell: the target URL + the hash/address to display. The data layers
// return this (pure data), and the components render it as a <HashLink> — so
// the data modules stay .ts and DOM-free.
export type ILink = { url: string; hash: string }

// A specs-table cell is either plain text or a link.
export type ISpecValue = string | ILink

export type ISpecs = ISpec[][]
export type ISpec = {
  title: string
  value: ISpecValue
  tooltip?: string
}

export type ISummary = {
  asset: string
  apy: string
  delegation: string
  lockup: string
  // True when the validator's term has ended — set by validator
  // summaries only; FSP summaries leave this undefined.
  expired?: boolean
}
