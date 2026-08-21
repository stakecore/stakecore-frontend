import PageHeader from '~/components/ui/pageHeader'
import ContactOption from '../components/sections/contact/contactOption'
import ContactForm from '../components/sections/contact/contactForm'
import '../components/sections/contact/contact.scss'

const Contact = () => {
  return (
    <section id="contact" className="contact-area innerpage-single-area">
      <div className="container">
        <PageHeader supTitle="Contact" title="Get in touch" />
        <div className="row">
          <ContactOption />
          <ContactForm />
        </div>
      </div>
    </section>
  )
}

export default Contact
