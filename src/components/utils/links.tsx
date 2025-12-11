import { RiFileCopyLine } from '@remixicon/react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Formatter } from '~/utils/misc/formatter'


export const CopyPasteButton = ({ text }) => {
  return <Link onClick={(event) => {
    event.preventDefault()
    navigator.clipboard.writeText(text)
    toast.success(`copied "${text}" to cipboard`)
  }} to="javascript(0);" >
    <RiFileCopyLine size={16} />
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
