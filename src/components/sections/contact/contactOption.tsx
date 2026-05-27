import { RiMapPinLine, RiSendPlaneLine } from '@remixicon/react'

const ContactOption = () => {
    return (
        <div className="col-lg-4">
            <div className="contact-content-part">
                <div className="single-contact">
                    <div className="contact-icon">
                        <i> <RiMapPinLine size={20} /></i>
                    </div>
                    <h2>our office</h2>
                    <p>
                        Sarisoma d.o.o.<br />
                        Ljubljana, Slovenia
                    </p>
                </div>
                <div className="single-contact">
                    <div className="contact-icon">
                        <i> <RiSendPlaneLine size={20} /></i>
                    </div>
                    <h2>telegram channel</h2>
                    <p>
                        <a href="https://t.me/+xZoChBQyyCo3OGY0" target="_blank" rel="noreferrer">
                            t.me/stakecore
                        </a>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default ContactOption