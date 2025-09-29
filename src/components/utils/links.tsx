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

export const ValidatorNodeLink = ({ nodeId, url }) => {
    return <span>
        <Link target="_blank" to={url}>{formatAddress(nodeId, 10)}</Link>
        &nbsp;&nbsp;
        <CopyPasteButton text={nodeId} />
    </span>
}

export const DelegationAddressLink = ({ address, link }) => {
    return <span>
        <Link target="_blank" to={link}>{formatAddress(address)}</Link>
        &nbsp;&nbsp;
        <CopyPasteButton text={address} />
    </span>
}