import { RiFileCopyLine } from '@remixicon/react'
import { Link } from 'react-router-dom'
import { formatAddress } from '../../utlits/eip6963/formatting'


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
        <a href={url} target="_blank" rel="noopener noreferrer">{formatAddress(address, 10)}</a>
        &nbsp;&nbsp;
        <CopyPasteButton text={address} />
    </span>
}