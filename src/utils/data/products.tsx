import type { ReactNode } from 'react'
import { RiPulseLine } from '@remixicon/react'

export interface ProductDeployment {
    label: string
    href: string
}

export interface Product {
    id: number
    icon: ReactNode
    title: string
    body: string
    /** Canonical deployment. Rendered as the primary link. */
    href: string
    /** Other deployments of the same product, rendered after the primary one. */
    alsoAt?: ProductDeployment[]
}

// The primary link is labelled with its own hostname, derived rather than
// stored so the label cannot drift from the href. `URL` throws on anything it
// cannot parse and this runs during render, where a throw unmounts the route —
// so the derivation falls back to the raw string instead.
//
// It stays out of `Formatter` deliberately: every member there is total by
// falling back to NO_VALUE, and a link labelled `—` is worse than one showing
// a raw href.
export const hostOf = (href: string): string => {
    try {
        return new URL(href).host
    } catch {
        return href
    }
}

// Software StakeCore built and runs in public. This sits under a heading that
// claims the team ships software, so an entry here is a claim about something
// deployed and reachable — not a private tool, and not a prototype.
export const productsData: Product[] = [
    {
        id: 1,
        icon: <RiPulseLine size={28} />,
        title: 'FAsset Visualiser',
        body: "A live system view of Flare's FAsset protocol. Each FAsset — FXRP, FBTC, FDOGE — is drawn as a tunnel whose width is its total backing capacity, split between minted backing and free capacity, with the agents behind it coloured by status and every mint and redemption flowing through as it happens. A second deployment runs the same view against the Coston2 test network.",
        href: 'https://fasset.stakecore.org',
        alsoAt: [
            { label: 'Coston2 testnet', href: 'https://fasset-coston2.stakecore.org' },
        ],
    },
]
