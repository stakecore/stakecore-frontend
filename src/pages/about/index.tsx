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
import PageHeader from '~/components/ui/pageHeader'
import InfraConstellation from './infraConstellation'
import ServerGlobe from './serverGlobe'
import StackCarousel from './stackCarousel'
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
            <PageHeader supTitle="About" title="Your stake, our engine">
                StakeCore runs blockchain node infrastructure — a redundant
                cluster we build, orchestrate, and monitor ourselves. Validator
                duty on Flare and Avalanche, and core oracle attestation signing
                on Flare and Songbird, are what it carries today, and we are
                actively taking it onto more networks. We're open to running any
                kind of workload, but we prefer to keep our stakers and
                delegators on core network protocols, where the{' '}
                <span className="about-mark">
                    risk profile stays close to that of simply holding the asset
                </span>
                .
            </PageHeader>
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
        body: <>Delegation is a vote, not a transfer. Nothing gets bridged, wrapped, or routed through a smart contract, and <span className="about-mark">we never take custody of anything</span> — your keys stay yours the entire time.</>,
    },
    {
        icon: <RiLineChartLine size={28} />,
        title: 'Transparent statistics',
        body: 'Delegation totals, reward history, and uptime are on this site, live, and every number behind them is on-chain. No NDA, no quarterly PDF, nothing you have to believe just because we said it.',
    },
    {
        icon: <RiStackLine size={28} />,
        title: 'One operator, any network',
        body: 'The same team and the same cluster stand behind every workload we run — validator duty, protocol signing, RPC and archive nodes, indexers, relayers. Whatever you hold, picking up another network doesn\'t mean finding someone new to trust.',
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
            <PageHeader
                variant="section"
                supTitle="Who we serve"
                title="From personal wallets to institutional treasuries"
            />
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
            <PageHeader
                variant="section"
                supTitle="Infrastructure"
                title={<>Small, robust, and{' '}<span className="about-mark">decentralized</span></>}
            />

            {/* Text precedes its visual in the DOM in both rows, so the stacked
                and screen-reader order stays heading → prose → visual. The globe
                is moved into the left column only at lg, where there are two
                columns to move it between. */}
            <div className="about-split about-split--visual-first">
                <div className="about-split-text">
                    <h3 className="about-split-title">Three providers, two continents</h3>
                    {/* The roster this paragraph used to recite — Nomad, OVH,
                        Hetzner — is now the carousel below, so this keeps only
                        the argument the logos can't make: where the nodes are,
                        and why that spread matters. */}
                    <p className="about-split-body">
                        The three server nodes holding cluster state sit in Beauharnois,
                        Helsinki, and Nuremberg, so an outage confined to one facility or
                        region costs us a single node, not the cluster. Worker nodes run
                        from Roubaix, Frankfurt, and Warsaw, plus our own premises in
                        Ljubljana — three independent providers, so no single one can
                        take the cluster down.
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
                        Three{' '}
                        <a
                            className="about-inline-link"
                            href="https://developer.hashicorp.com/nomad/docs"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Nomad
                        </a>{' '}
                        server nodes orchestrate the validators and FSP
                        signers we run across Flare, Songbird, and Avalanche. Nothing in
                        that arrangement is particular to those chains: to the scheduler
                        a node is a containerised job with a data volume, a set of ports,
                        and a health check, so another network's client — validating or
                        not — is a job specification and a place to put it. Any worker
                        node can host any workload — failure of a single node is
                        recovered automatically by re-scheduling somewhere else in the
                        cluster.
                    </p>
                </div>
                <div className="about-split-visual">
                    <InfraConstellation />
                </div>
            </div>

            <div className="about-stack">
                <h3 className="about-split-title">What the cluster runs on</h3>
                {/* Two columns of prose rather than prose beside a visual: this
                    row has no third illustration, and the marquee below runs the
                    container's full width. */}
                <div className="about-stack-prose">
                    <p className="about-split-body">
                        WireGuard links our nodes into one private network, whichever
                        provider or site they sit in. Nomad places every workload onto
                        that network and keeps it running, moving a job between nodes in
                        case of failures. Each job pulls its signing keys and service
                        credentials from Vault when it starts, rather than carrying them
                        in an image. HAProxy balances traffic between jobs inside that
                        network, and Traefik publishes the APIs and websites that need
                        to be reachable from outside it.
                    </p>
                    <p className="about-split-body">
                        From there, everything the cluster does becomes a signal. Alloy
                        ships every container's logs to Loki, Prometheus scrapes the
                        metrics, and both are read through Grafana. Sentry catches what
                        neither can: an exception reporting itself from inside the
                        process that failed. Healthchecks.io waits outside the cluster
                        for jobs to check in on schedule, and treats silence as the
                        alarm. When one of Grafana's alert rules fires the
                        alert lands in Telegram, and Claude helps the on-call engineer
                        work out why, correlating logs against metrics and drafting a
                        fix.
                    </p>
                </div>
                <StackCarousel />
            </div>
        </div>
    </section>
)


const ValueProps = () => (
    <section className="about-section">
        <div className="container">
            <PageHeader
                variant="section"
                supTitle="Why StakeCore"
                title="Four things worth knowing"
            />
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
