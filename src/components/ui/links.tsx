import { useState } from 'react'
import { RiCheckLine, RiFileCopyLine } from '@remixicon/react'
import { Formatter } from '~/utils/misc/formatter'


// Copy is an action, not navigation — a <button>, not a <Link> pointing at a
// bogus `javascript(0);` route that only worked because preventDefault ran.
export const CopyPasteButton = ({ text }) => {
  const [copied, setCopied] = useState(false)

  return <button
    type="button"
    aria-label="Copy to clipboard"
    onClick={() => {
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }}
    style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', color: 'inherit', display: 'inline-flex', verticalAlign: 'middle' }}
  >
    {copied ? <RiCheckLine size={16} color="var(--bs-success, #198754)" /> : <RiFileCopyLine size={16} />}
  </button>
}

export const HashLink = ({ address: hash, url, length = 10, copy = true }) => {
  return <span>
    <a style={{ fontFamily: 'monospace' }} href={url} target="_blank" rel="noopener noreferrer">
      {Formatter.address(hash, length)}
    </a>
    { copy && <>&nbsp; <CopyPasteButton text={hash} /></> }
  </span>
}
