import { Link } from 'react-router'
import { RiArrowRightLine } from '@remixicon/react'
import './proposal.scss'

// Cards only — no section, container or heading of its own. This renders into
// CallToAction's slot, which already supplies all three, and a second <h2>
// there would duplicate the "Use your crypto" the cards sit under. Until the
// panel became a persistent frame this component replaced that whole section
// and so carried its own PageHeader, pinned to the same display ramp as the
// heading it was standing in for.
const Proposal = ({ priceData }: any) => {
    return (
        <div className="row justify-content-center pricing-row">
            {priceData.map(({ features, id, price, sortInfo, title }) => <Card
                key={id} features={features} price={price} sortInfo={sortInfo} title={title}
            />)}
        </div>
    )
}

export default Proposal


const Card = ({ title, price, sortInfo, features }) => {
    return (
        <div className="col-lg-4 col-md-6">
            <div className="pricing-item">
                <div className="pricing-header">
                    <h4 className="title">{title}</h4>
                    <p className="save-percent">{sortInfo}</p>
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