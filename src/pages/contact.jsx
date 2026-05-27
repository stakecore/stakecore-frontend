import ContactOption from '../components/sections/contact/contactOption'
import ContactForm from '../components/sections/contact/contactForm'
import '../components/sections/contact/contact.scss'

const Contact = () => {
  return (
    <section id="contact" className="contact-area innerpage-single-area">
      <div className="container">
        <header className="contact-header">
          <p className="contact-header-sup">Contact</p>
          <h1 className="contact-header-main">Get in touch</h1>
        </header>
        <div className="row">
          <ContactOption />
          <ContactForm />
        </div>
      </div>
    </section>
  )
}

export default Contact
