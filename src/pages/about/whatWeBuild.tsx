import { hostOf, productsData } from '~/utils/data/products'

// Software StakeCore built and runs in public. Rendered between the
// infrastructure section and the closing value props: the section above ends
// on what the cluster runs on, and "it runs our own software too" is the next
// beat.
//
// A sibling component rather than another module-scope const inside index.tsx
// so it can be tested without mounting ServerGlobe and InfraConstellation,
// both of which are canvas-backed and unavailable under happy-dom.
const WhatWeBuild = () => (
    <section className="about-section">
        <div className="container">
            <header className="about-section-header">
                <p className="about-section-header-sup">What we build</p>
                <h2 className="about-section-header-main">
                    The cluster runs{' '}
                    <span className="about-mark">our own software</span> too
                </h2>
            </header>

            {/* .about-grid, not .about-grid--two: a single entry in the
                two-column variant reads as a broken pair, while in the base
                three-column grid it reads as the first of a row. Revisit at
                two or four entries. */}
            <div className="about-grid">
                {productsData.map(({ id, icon, title, body, href, alsoAt }) => (
                    <article key={id} className="about-tile about-tile--wide">
                        <div className="about-tile-icon">{icon}</div>
                        <div>
                            <h3 className="about-tile-title">{title}</h3>
                            <p className="about-tile-body">{body}</p>
                            {/* The tile keeps the no-hover rule the other
                                about tiles carry — these links are the
                                affordance, not the card. */}
                            <p className="about-product-links">
                                <a
                                    className="about-inline-link"
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {hostOf(href)}
                                </a>
                                {alsoAt?.map(({ label, href: deploymentHref }) => (
                                    <a
                                        key={deploymentHref}
                                        className="about-product-link-alt"
                                        href={deploymentHref}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={`${title} on ${label}`}
                                    >
                                        {label}
                                    </a>
                                ))}
                            </p>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    </section>
)

export default WhatWeBuild
