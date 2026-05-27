import {
    RiShieldCheckLine,
    RiBuilding4Line,
    RiBankLine,
    RiBriefcase4Line,
    RiServerLine,
    RiLineChartLine,
    RiPulseLine,
    RiNodeTree,
} from '@remixicon/react'
import SlideUp from '../utils/animations/slideUp'
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
            <div className="container-inner">
                <div className="row">
                    <div className="col-xl-12 col-lg-12">
                        <SlideUp>
                            <div className="about-content-part text-center">
                                <p style={{ textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--primary-color)', marginBottom: 12 }}>
                                    Staking infrastructure, for institutions
                                </p>
                                <h2 style={{ fontSize: 44, lineHeight: 1.15, marginBottom: 24 }}>
                                    Turn the native tokens on your balance sheet into <span style={{ color: 'var(--primary-color)' }}>productive, low-risk yield.</span>
                                </h2>
                                <p style={{ fontSize: 17, maxWidth: 760, margin: '0 auto' }}>
                                    StakeCore operates validator and protocol-signing infrastructure for the
                                    Flare, Avalanche, and Songbird networks. Protocols, custodians, and
                                    treasuries delegate their FLR, AVAX, and SGB to us — earning rewards
                                    with a risk profile equivalent to simply holding the asset.
                                </p>
                            </div>
                        </SlideUp>
                    </div>
                </div>
            </div>
        </div>
    </section>
)


const audiences = [
    {
        icon: <RiBuilding4Line size={48} />,
        title: 'Protocols & Foundations',
        body: 'Make your native treasury productive. Earn rewards on the same tokens that secure your network, without giving up custody or introducing new counterparties.',
    },
    {
        icon: <RiBankLine size={48} />,
        title: 'Custodians, Exchanges & Wallets',
        body: 'Offer staking yield to your end users on Flare, Avalanche, and Songbird. Non-custodial delegation means client tokens stay in client wallets — you pass through the rewards.',
    },
    {
        icon: <RiBriefcase4Line size={48} />,
        title: 'Funds, Treasuries & Family Offices',
        body: 'Put idle FLR, AVAX, or SGB to work. No bridges, no synthetic wrappers, no smart-contract surface — just direct delegation to validators we run ourselves.',
    },
]


const Audiences = () => (
    <section className="services-area">
        <div className="container">
            <div className="container-inner">
                <div className="row">
                    <div className="col-xl-12 col-lg-12">
                        <SlideUp>
                            <div className="section-title text-center">
                                <p>Who we serve</p>
                                <h2>Built for crypto-native businesses</h2>
                            </div>
                        </SlideUp>
                    </div>
                </div>
                <div className="row">
                    {audiences.map(({ icon, title, body }, i) => (
                        <div key={i} className="col-lg-4 col-md-6">
                            <SlideUp delay={i + 1}>
                                <div className="service-item">
                                    {icon}
                                    <h4>{title}</h4>
                                    <p>{body}</p>
                                </div>
                            </SlideUp>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </section>
)


const stack = [
    {
        icon: <RiServerLine size={36} />,
        title: 'Validator nodes',
        body: 'Snowball consensus participation on Avalanche and Flare. Redundant deployments across regions.',
    },
    {
        icon: <RiNodeTree size={36} />,
        title: 'FSP & SSP signers',
        body: 'Flare Systems Protocol and Songbird Systems Protocol signing infrastructure with sub-epoch reliability targets.',
    },
    {
        icon: <RiPulseLine size={36} />,
        title: '24/7 monitoring',
        body: 'Automated alerting, on-call rotation, and a transparent uptime record published live on this site.',
    },
]


const Stack = () => (
    <section className="services-area">
        <div className="container">
            <div className="container-inner">
                <div className="row">
                    <div className="col-xl-12 col-lg-12">
                        <SlideUp>
                            <div className="section-title text-center">
                                <p>What we run</p>
                                <h2>The full consensus stack</h2>
                            </div>
                        </SlideUp>
                    </div>
                </div>
                <div className="row">
                    {stack.map(({ icon, title, body }, i) => (
                        <div key={i} className="col-lg-4 col-md-6">
                            <SlideUp delay={i + 1}>
                                <div className="service-item">
                                    {icon}
                                    <h4>{title}</h4>
                                    <p>{body}</p>
                                </div>
                            </SlideUp>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </section>
)


const valueProps = [
    {
        icon: <RiShieldCheckLine size={44} />,
        title: 'Risk-equivalent to holding the asset',
        body: 'Delegated tokens never leave your wallet. No smart contracts in the path, no bridges, no liquid-staking derivative. The only risk you take on is the same risk you took when you bought the token.',
    },
    {
        icon: <RiLineChartLine size={44} />,
        title: 'Transparent, on-chain reporting',
        body: 'Live delegation totals, reward history, and uptime are published on this site — no NDA, no quarterly PDF. Verify everything yourself, on-chain, at any time.',
    },
    {
        icon: <RiPulseLine size={44} />,
        title: 'Multi-network, multi-protocol coverage',
        body: 'One counterparty across Flare, Avalanche, and Songbird, and across both validator and FSP/SSP roles. One contract, one onboarding, one point of contact.',
    },
    {
        icon: <RiServerLine size={44} />,
        title: 'Direct support from the engineers',
        body: 'Institutional partners get a direct line to the team running the nodes. Integration questions, custom reporting, reward routing — handled by the people who actually built it.',
    },
]


const ValueProps = () => (
    <section className="services-area">
        <div className="container">
            <div className="container-inner">
                <div className="row">
                    <div className="col-xl-12 col-lg-12">
                        <SlideUp>
                            <div className="section-title text-center">
                                <p>Why StakeCore</p>
                                <h2>Yield, without the asterisks</h2>
                            </div>
                        </SlideUp>
                    </div>
                </div>
                <div className="row">
                    {valueProps.map(({ icon, title, body }, i) => (
                        <div key={i} className="col-lg-6">
                            <SlideUp delay={i + 1}>
                                <div className="service-item" style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: 24 }}>
                                    <div style={{ flexShrink: 0, color: 'var(--primary-color)' }}>{icon}</div>
                                    <div>
                                        <h4 style={{ marginTop: 0 }}>{title}</h4>
                                        <p>{body}</p>
                                    </div>
                                </div>
                            </SlideUp>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </section>
)


