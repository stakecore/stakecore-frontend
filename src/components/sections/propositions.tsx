import { Link } from 'react-router-dom'
import { RiArrowRightLine } from '@remixicon/react'
import SlideUp from '../../utils/animations/slideUp'

const Propositions = ({ priceData }: any) => {
    return (
        <section className="pricing-area">
            <div className="container">
                <div className="container-inner">
                    <div className="row">
                        <div className="col-xl-12 col-lg-12">
                            <SlideUp>
                                <div className="section-title text-center">
                                    <h2>Earn yield for your dormant FLR, AVAX, or SGB without any additional risk</h2>
                                </div>
                            </SlideUp>
                        </div>
                    </div>
                    <div className="row justify-content-center">
                        {priceData.map(({ features, id, price, sortInfo, title }) => <Card
                            key={id} id={id} features={features} price={price} sortInfo={sortInfo} title={title}
                        />)}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Propositions


const Card = ({id, title, price, sortInfo, features }) => {
    return (
        <div className="col-lg-4 col-md-6">
            <SlideUp delay={id}>
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
            </SlideUp>
        </div>
    )
}