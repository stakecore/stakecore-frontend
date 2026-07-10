import {
    RiShieldCheckLine,
    RiBuilding4Line,
    RiBankLine,
    RiBriefcase4Line,
    RiServerLine,
    RiLineChartLine,
    RiPulseLine,
} from '@remixicon/react'
import InfraConstellation from './infraConstellation'
import './about.scss'


const About = () => {
    return (
        <>
            <Mission />
            <Audiences />
            <Stack />
            <ValueProps />
        </>
    )
}

export default About


const Mission = () => (
    <section id="about" className="about-single-area innerpage-single-area">
        <div className="container">
            <header className="about-header">
                <p className="about-header-sup">Staking infrastructure for institutions</p>
                <h1 className="about-header-main">
                    Turn the native tokens on your balance sheet into productive, low-risk yield.
                </h1>
                <p className="about-header-body">
                    StakeCore operates validator and protocol-signing infrastructure for the
                    Flare, Avalanche, and Songbird networks. Protocols, custodians, and
                    treasuries delegate their FLR, AVAX, and SGB to us — earning rewards
                    with a risk profile close to that of simply holding the asset.
                </p>
            </header>
        </div>
    </section>
)


const audiences = [
    {
        icon: <RiBuilding4Line size={32} />,
        title: 'Protocols & foundations',
        body: 'Make your native treasury productive. Earn rewards on the same tokens that secure your network, without giving up custody or introducing new counterparties.',
    },
    {
        icon: <RiBankLine size={32} />,
        title: 'Custodians, exchanges & wallets',
        body: 'Offer staking yield to your end users on Flare, Avalanche, and Songbird. Non-custodial delegation means client tokens stay in client wallets — you pass through the rewards.',
    },
    {
        icon: <RiBriefcase4Line size={32} />,
        title: 'Funds, treasuries & family offices',
        body: 'Put idle FLR, AVAX, or SGB to work. No bridges, no synthetic wrappers, no smart-contract surface — just direct delegation to validators we run ourselves.',
    },
]


const valueProps = [
    {
        icon: <RiShieldCheckLine size={28} />,
        title: 'Risk-equivalent to holding the asset',
        body: 'Delegated tokens never leave your wallet — no smart contracts in the path, no bridges, no liquid-staking derivatives. The risk profile stays close to that of simply holding the asset.',
    },
    {
        icon: <RiLineChartLine size={28} />,
        title: 'Transparent, on-chain reporting',
        body: 'Live delegation totals, reward history, and uptime are published on this site — no NDA, no quarterly PDF. Verify everything yourself, on-chain, at any time.',
    },
    {
        icon: <RiPulseLine size={28} />,
        title: 'Multi-network, multi-protocol coverage',
        body: 'One counterparty across Flare, Avalanche, and Songbird, and across both validator and FSP/SSP roles. One contract, one onboarding, one point of contact.',
    },
    {
        icon: <RiServerLine size={28} />,
        title: 'Direct support from the engineers',
        body: 'Institutional partners get a direct line to the team running the nodes. Integration questions, custom reporting, reward routing — handled by the people who actually built it.',
    },
]


const Audiences = () => (
    <section className="about-section">
        <div className="container">
            <header className="about-section-header">
                <p className="about-section-header-sup">Who we serve</p>
                <h2 className="about-section-header-main">Built for crypto-native businesses</h2>
            </header>
            <div className="about-grid">
                {audiences.map(({ icon, title, body }, i) => (
                    <article key={i} className="about-tile">
                        <div className="about-tile-icon">{icon}</div>
                        <h3 className="about-tile-title">{title}</h3>
                        <p className="about-tile-body">{body}</p>
                    </article>
                ))}
            </div>
        </div>
    </section>
)


const Stack = () => (
    <section className="about-section">
        <div className="container">
            <header className="about-section-header">
                <p className="about-section-header-sup">Infrastructure</p>
                <h2 className="about-section-header-main">A small cluster, plenty of redundancy</h2>
            </header>
            <p className="about-section-body">
                Three Nomad server nodes orchestrate the validators and FSP signers we
                run across Flare, Songbird, and Avalanche. Any client node can host any
                workload — failure of a single node is recovered automatically by
                re-scheduling somewhere else in the cluster.
            </p>
            <div className="about-constellation-wrap">
                <InfraConstellation />
            </div>
        </div>
    </section>
)


const ValueProps = () => (
    <section className="about-section">
        <div className="container">
            <header className="about-section-header">
                <p className="about-section-header-sup">Why StakeCore</p>
                <h2 className="about-section-header-main">Yield, without the asterisks</h2>
            </header>
            <div className="about-grid about-grid--two">
                {valueProps.map(({ icon, title, body }, i) => (
                    <article key={i} className="about-tile about-tile--wide">
                        <div className="about-tile-icon">{icon}</div>
                        <div>
                            <h3 className="about-tile-title">{title}</h3>
                            <p className="about-tile-body">{body}</p>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    </section>
)
