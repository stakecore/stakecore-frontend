import { RiFileCopyLine } from '@remixicon/react'
import { Link } from 'react-router-dom'
import { Formatter } from '~/utlits/misc/formatter'


export const CopyPasteButton = ({ text }) => {
  return <Link onClick={(event) => {
    event.preventDefault()
    navigator.clipboard.writeText(text)
  }} to="javascript(0);" >
    <RiFileCopyLine size={16} />
  </Link>
}

export const HashLink = ({ address: hash, url, length = 10 }) => {
  return <span>
    <a style={{ fontFamily: 'monospace' }} href={url} target="_blank" rel="noopener noreferrer">{Formatter.address(hash, length)}</a>
    &nbsp;&nbsp;
    <CopyPasteButton text={hash} />
  </span>
}
