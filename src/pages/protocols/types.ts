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

// A bounded summary field: the two ends plus the unit they share. Structured
// rather than a pre-joined string for the same reason ILink is — the data
// layers stay DOM-free and info.tsx decides how to mark the bounds up. The
// string form it replaces ("25.0 to 93.0") left the reader to infer that the
// numbers were a min and a max, and carried no unit at all, since the asset
// sits in a different row of the same card.
export type IRange = { min: string; max: string; unit?: string }

// A summary cell is either plain text ('No Limit' on the FSP routes,
// 'Unavailable' when a validator is full or expiring) or a range.
export type ISummaryValue = string | IRange

export type ISummary = {
  asset: string
  apy: string
  delegation: ISummaryValue
  lockup: ISummaryValue
  // True when the validator's term has ended — set by validator
  // summaries only; FSP summaries leave this undefined.
  expired?: boolean
}
