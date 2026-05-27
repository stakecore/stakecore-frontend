import { useState } from 'react'
import { Link } from 'react-router-dom'
import { RiArrowRightUpLine } from '@remixicon/react'
import { protocolsData } from '../../utils/data/protocols'
import './portfolio.scss'

const Portfolio = ({ className = '' }) => {
    const [category, setCategory] = useState('All')

    const filteredCategory = ['All']
    protocolsData.forEach(({ category }) => {
        if (!filteredCategory.includes(category)) filteredCategory.push(category)
    })

    const filteredProjects = category === 'All'
        ? protocolsData
        : protocolsData.filter(p => p.category === category)

    return (
        <section className={`protocols ${className}`}>
            <div className="container">
                <header className="protocols-header">
                    <h2 className="protocols-title">Protocols</h2>
                    <p className="protocols-blurb">
                        Validator and protocol-signing services on Flare, Avalanche, and
                        the Songbird test network. Each protocol specifies its own rules
                        and reward structure.
                    </p>
                </header>

                <ul className="protocols-filter">
                    {filteredCategory.map((item) => (
                        <li key={item}>
                            <button
                                type="button"
                                onClick={() => setCategory(item)}
                                className={item === category ? 'active' : ''}
                            >
                                {item}
                            </button>
                        </li>
                    ))}
                </ul>

                <div className="protocols-grid">
                    {filteredProjects.map(({ id, category, title, href, src }) => (
                        <Link key={id} to={href} className="protocols-tile">
                            <div className="protocols-tile-image">
                                <img src={src} alt="" />
                            </div>
                            <div className="protocols-tile-content">
                                <span className="protocols-tile-category">{category}</span>
                                <h3 className="protocols-tile-title">
                                    <span>{title}</span>
                                    <RiArrowRightUpLine size={16} className="protocols-tile-arrow" />
                                </h3>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default Portfolio
