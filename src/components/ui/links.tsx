import { useState } from 'react'
import { RiCheckLine, RiFileCopyLine } from '@remixicon/react'
import { Link } from 'react-router-dom'
import { Formatter } from '~/utils/misc/formatter'


export const CopyPasteButton = ({ text }) => {
  const [copied, setCopied] = useState(false)

  return <Link onClick={(event) => {
    event.preventDefault()
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }} to="javascript(0);" >
    {copied ? <RiCheckLine size={16} color="var(--bs-success)" /> : <RiFileCopyLine size={16} />}
  </Link>
}

export const HashLink = ({ address: hash, url, length = 10, copy = true }) => {
  return <span>
    <a style={{ fontFamily: 'monospace' }} href={url} target="_blank" rel="noopener noreferrer">
      {Formatter.address(hash, length)}
    </a>
    { copy && <>&nbsp; <CopyPasteButton text={hash} /></> }
  </span>
}
