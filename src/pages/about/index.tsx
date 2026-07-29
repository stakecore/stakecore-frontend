import {
    RiShieldCheckLine,
    RiBuilding4Line,
    RiBankLine,
    RiBriefcase4Line,
    RiUserVoiceLine,
    RiLineChartLine,
    RiStackLine,
    RiWallet3Line,
} from '@remixicon/react'
import InfraConstellation from './infraConstellation'
import ServerGlobe from './serverGlobe'
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
                <p className="about-header-sup">About</p>
                <h1 className="about-header-main">
                    Your stake, our engine
                </h1>
                <p className="about-header-body">
                    StakeCore runs validator and protocol-signing infrastructure — a
                    redundant cluster we build, orchestrate, and monitor ourselves, today
                    serving the Flare, Avalanche, and Songbird networks. From individual
                    holders to protocols, custodians, and treasuries, anyone can delegate
                    or stake their native tokens with us, earning rewards with a{' '}
                    <span className="about-mark">
                        risk profile close to that of simply holding the asset
                    </span>
                    . New networks are welcome: on a cluster like ours, taking on a chain
                    is a scheduling change, not a rebuild.
                </p>
            </header>
        </div>
    </section>
)


const audiences = [
    {
        icon: <RiWallet3Line size={28} />,
        title: 'Individual holders',
        body: 'Whether you hold a hundred tokens or a hundred thousand, the rate is the same — rewards are proportional and we run no tiers. No account to open and no onboarding call to sit through.',
    },
    {
        icon: <RiBuilding4Line size={28} />,
        title: 'Protocols & foundations',
        body: 'The treasury you are sitting on is denominated in the token your own network runs on. Putting it to work adds weight to the validator set securing that network, and the rewards land back in the treasury.',
    },
    {
        icon: <RiBankLine size={28} />,
        title: 'Custodians, exchanges & wallets',
        body: 'Offer staking to your users without becoming an infrastructure operator yourself. You keep the relationship and the interface; we run the nodes and publish the uptime you quote them.',
    },
    {
        icon: <RiBriefcase4Line size={28} />,
        title: 'Funds, treasuries & family offices',
        body: 'A mandate that rules out wrapped assets and derivatives is the usual blocker to staking. Delegation keeps the position in the instrument you already hold, so there is nothing new to put past a risk committee.',
    },
]


const valueProps = [
    {
        icon: <RiShieldCheckLine size={28} />,
        title: 'Tokens that never move',
        body: 'Delegation is a vote, not a transfer. Nothing gets bridged, wrapped, or routed through a smart contract, and we never take custody of anything — your keys stay yours the entire time.',
    },
    {
        icon: <RiLineChartLine size={28} />,
        title: 'Transparent statistics',
        body: 'Delegation totals, reward history, and uptime are on this site, live, and every number behind them is on-chain. No NDA, no quarterly PDF, nothing you have to believe just because we said it.',
    },
    {
        icon: <RiStackLine size={28} />,
        title: 'One operator, every chain',
        body: 'Whatever you hold, the same team and the same cluster stand behind it — validator duty and protocol signing alike. Picking up another network doesn\'t mean finding someone new to trust.',
    },
    {
        icon: <RiUserVoiceLine size={28} />,
        title: 'Direct access to the engineers',
        body: 'Partners get a direct line to the engineers who built the cluster: integration questions, custom reporting, reward routing, answered by whoever is on call for it. Everyone else reaches the same team through our socials or the contact page.',
    },
]


const Audiences = () => (
    <section className="about-section">
        <div className="container">
            <header className="about-section-header">
                <p className="about-section-header-sup">Who we serve</p>
                <h2 className="about-section-header-main">From personal wallets to institutional treasuries</h2>
            </header>
            <div className="about-grid about-grid--two">
                {audiences.map(({ icon, title, body }, i) => (
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


const Stack = () => (
    <section className="about-section">
        <div className="container">
            <header className="about-section-header">
                <p className="about-section-header-sup">Infrastructure</p>
                <h2 className="about-section-header-main">
                    Small, robust, and{' '}
                    <span className="about-mark">decentralized</span>
                </h2>
            </header>

            {/* Text precedes its visual in the DOM in both rows, so the stacked
                and screen-reader order stays heading → prose → visual. The globe
                is moved into the left column only at lg, where there are two
                columns to move it between. */}
            <div className="about-split about-split--visual-first">
                <div className="about-split-text">
                    <h3 className="about-split-title">Three providers, two continents</h3>
                    <p className="about-split-body">
                        The three{' '}
                        <a
                            className="about-inline-link"
                            href="https://developer.hashicorp.com/nomad/docs"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Nomad
                        </a>{' '}
                        server nodes holding cluster state sit in Beauharnois,
                        Helsinki, and Nuremberg, so an outage confined to one facility or
                        region costs us a single node, not the cluster. Worker nodes run
                        from Roubaix, Frankfurt, and Warsaw, plus our own premises in
                        Ljubljana — spreading the cluster across OVH, Hetzner, and
                        hardware we host ourselves, so no single provider can take it
                        down.
                    </p>
                </div>
                <div className="about-split-visual">
                    <ServerGlobe />
                </div>
            </div>

            <div className="about-split">
                <div className="about-split-text">
                    <h3 className="about-split-title">A purpose-built cluster, plenty of redundancy</h3>
                    <p className="about-split-body">
                        Three Nomad server nodes orchestrate the validators and FSP signers
                        we run across Flare, Songbird, and Avalanche. Any worker node can
                        host any workload — failure of a single node is recovered
                        automatically by re-scheduling somewhere else in the cluster.
                    </p>
                </div>
                <div className="about-split-visual">
                    <InfraConstellation />
                </div>
            </div>
        </div>
    </section>
)


const ValueProps = () => (
    <section className="about-section">
        <div className="container">
            <header className="about-section-header">
                <p className="about-section-header-sup">Why StakeCore</p>
                <h2 className="about-section-header-main">Four things worth knowing</h2>
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
