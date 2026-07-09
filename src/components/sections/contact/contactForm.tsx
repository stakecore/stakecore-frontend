import { RiMailLine } from '@remixicon/react'
import { toast } from 'react-toastify'
import { LandingPageService, FormDto } from '../../../backendApi'


const reemail = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/

const ContactForm = () => {

    function formIsValid(fd: FormDto): boolean {
        return fd.email != null && reemail.test(fd.email)
    }

    async function submitForm(e: React.FormEvent<HTMLFormElement>) {
        // onSubmit (not the button's onClick) so the browser runs the inputs'
        // native required/minLength/type=email constraints first; this handler
        // only fires once they pass. preventDefault then stops the page reload.
        e.preventDefault()
        const id = toast.loading('sending message to the server')

        let success = false
        let error = 'Failed'
        try {
            const form = e.currentTarget
            const data = Object.fromEntries(new FormData(form).entries()) as FormDto
            if (!formIsValid(data)) {
                error = 'Email validation failed'
            } else {
                const response = await LandingPageService.pageControllerSubmitForm(data)
                success = response.status == 201
                error = response.error ?? error
            }
        } catch (e) {
            error = e.message
        }

        if (success) {
            toast.update(id, {
                type: 'success',
                render: 'message successfully sent',
                isLoading: false,
                autoClose: 3000
            })
        } else {
            toast.update(id, {
                type: 'error',
                render: error,
                isLoading: false,
                autoClose: 3000
            })
        }
    }

    return (
        <div className="col-lg-8">
            <div className="contact-form contact-form-area">
                <form id="contactForm" className="contactForm" name="contactForm" onSubmit={submitForm}>
                    <div className="row">
                        <div className="col-md-6">
                            <div className="form-group">
                                <label htmlFor="name">Full Name</label>
                                <input type="text" id="name" name="name" className="form-control" placeholder="Jane Doe" required={true} minLength={4} maxLength={25} data-error="Please enter your Name" />
                                <label htmlFor="name" className="for-icon"><i className="far fa-user"></i></label>
                                <div className="help-block with-errors"></div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <input type="email" id="email" name="email" className="form-control" placeholder="hi@mail.com" required={true} minLength={5} maxLength={35} data-error="Please enter your Email" />
                                <label htmlFor="email" className="for-icon"><i className="far fa-envelope"></i></label>
                                <div className="help-block with-errors"></div>
                            </div>
                        </div>
                        <div className="col-md-12">
                            <div className="form-group">
                                <label htmlFor="message">Your Message</label>
                                <textarea name="message" id="message" className="form-control" rows={4} placeholder="Write your message" required={true} minLength={10} maxLength={250} data-error="Please Write your Message"></textarea>
                                <div className="help-block with-errors"></div>
                            </div>
                        </div>
                        <div className="col-md-12">
                            <div className="form-group mb-0">
                                <button type="submit" className="theme-btn">
                                    Send Message <i><RiMailLine size={15} /></i>
                                </button>
                                <div id="msgSubmit"></div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ContactForm