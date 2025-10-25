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

export const AddressLink = ({ address, url }) => {
  return <span>
    <a href={url} target="_blank" rel="noopener noreferrer">{Formatter.address(address, 10)}</a>
    &nbsp;&nbsp;
    <CopyPasteButton text={address} />
  </span>
}