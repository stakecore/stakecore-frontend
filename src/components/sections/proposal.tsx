import { Link } from 'react-router-dom'
import { RiArrowRightLine } from '@remixicon/react'
import './proposal.scss'

const Proposal = ({ priceData }: any) => {
    return (
        <section className="pricing-area">
            <div className="container">
                <header className="pricing-header-section">
                    <h2 className="pricing-header-main">Earn Yield</h2>
                </header>
                <div className="row justify-content-center">
                    {priceData.map(({ features, id, price, sortInfo, title }) => <Card
                        key={id} features={features} price={price} sortInfo={sortInfo} title={title}
                    />)}
                </div>
            </div>
        </section>
    )
}

export default Proposal


const Card = ({ title, price, sortInfo, features }) => {
    return (
        <div className="col-lg-4 col-md-6">
            <div className="pricing-item">
                <div className="pricing-header">
                    <h4 className="title">{title}</h4>
                    <p className="save-percent" dangerouslySetInnerHTML={{ __html: sortInfo }} />
                    <span className="price">{price}</span>
                </div>
                <div className="pricing-details">
                    <ul>
                        {
                            features.map(({ id, feature, link }) => <li key={id}>
                                <i> <RiArrowRightLine size={14} /></i>
                                <Link to={link}>{feature}</Link>
                            </li>)
                        }
                    </ul>
                </div>
            </div>
        </div>
    )
}