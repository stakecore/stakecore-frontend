import { RiMapPinLine, RiSendPlaneLine } from '@remixicon/react'
import SlideUp from '../../../utils/animations/slideUp'

const ContactOption = () => {
    return (
        <div className="col-lg-4">
            <SlideUp>
                <div className="contact-content-part">
                    <SlideUp delay={2}>
                        <div className="single-contact">
                            <div className="contact-icon">
                                <i> <RiMapPinLine size={20} /></i>
                            </div>
                            <h2>our office:</h2>
                            <p>Ljubljana, Slovenia</p>
                        </div>
                    </SlideUp>
                    <SlideUp delay={3}>
                        <div className="single-contact wow fadeInUp" data-wow-delay=".4s">
                            <div className="contact-icon">
                                <i> <RiSendPlaneLine size={20} /></i>
                            </div>
                            <h2>telegram channel:</h2>
                            <p>
                                <a href="https://t.me/+xZoChBQyyCo3OGY0" target="_blank" rel="noreferrer">
                                    t.me/stakecore
                                </a>
                            </p>
                        </div>
                    </SlideUp>
                </div>
            </SlideUp>
        </div>
    )
}

export default ContactOption