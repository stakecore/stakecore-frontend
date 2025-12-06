import { useState } from 'react'
import { Link } from 'react-router-dom'
import { RiArrowRightUpLine } from '@remixicon/react'
import SlideUp from '../../utils/animations/slideUp'
import { protocolsData } from '../../utils/data/protocols'

const animations = ['slideIn', 'fadeIn', 'scaleUp']

const getRandomAnimation = () => {
    const randomIndex = Math.floor(Math.random() * animations.length);
    return animations[randomIndex];
};

const Portfolio = ({ className }) => {
    const [category, setCategory] = useState('All');
    const [animationClass, setAnimationClass] = useState('');

    const handleCategoryClick = (item) => {
        setCategory(item)
        const randomAnimation = getRandomAnimation();
        setAnimationClass(randomAnimation);
    }

    // ------ filter unique category
    const filteredCategory = ["All"]
    protocolsData.forEach(({ category }) => {
        if (!filteredCategory.includes(category)) {
            filteredCategory.push(category)
        }
    })
    // ------ filter unique category

    const filteredProjects = category === 'All' ? protocolsData : protocolsData.filter(image => image.category === category);

    return (
        <section id="portfolio" className={`projects-area ${className}`}>
            <div className="container">
                <div className="container-inner">
                    <div className="row">
                        <div className="col-xl-12 col-lg-12">
                            <SlideUp>
                                <div className="section-title text-center">
                                    <h2>Protocols</h2>
                                    <p>As of now we provide services to core protocols on Avalanche and Flare network,
                                        along with Flare's economic testnet Songbird.
                                        All of the supported protocols specify their own rules and reward structure.
                                    </p>
                                </div>
                            </SlideUp>
                        </div>
                    </div>
                    <SlideUp>
                        <ul className="project-filter filter-btns-one justify-content-left pb-15">
                            {filteredCategory.map((item, id) => <li key={id} onClick={
                                () => handleCategoryClick(item)
                            } className={item === category ? "current" : ""}>{item}</li>)}
                        </ul>
                    </SlideUp>
                    <div className="row project-masonry-active overflow-hidden">
                        {filteredProjects.map(({ category, id, src, title, href }) =>
                            <Card href={href} key={id} id={id} category={category} src={src} title={title} animationClass={animationClass} />
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Portfolio


const Card = ({ category, title, src, animationClass, id, href }) => {
    return (
        <div className={`col-lg-4 col-md-6 item branding game ${animationClass}`}>
            <SlideUp delay={id}>
                <div className="project-item style-two">
                    <div className="project-image">
                        <img src={src} alt="Protocol" />
                        <Link to={href} className="details-btn"><RiArrowRightUpLine /> </Link>
                    </div>
                    <div className="project-content">
                        <span className="sub-title">{category}</span>
                        <h3>{title}</h3>
                    </div>
                </div>
            </SlideUp>
        </div>
    )
}