import { Link } from 'react-router'

const NotFound = () => (
    <section className="innerpage-single-area">
        <div className="container">
            <div className="error-container error-container--centered">
                <div className="error-status">404</div>
                {/* <h1>, not a <div>: this is a whole route, and "Page not
                    found" is what reads as its title. WCAG 1.3.1 wants that
                    relationship in the markup, and it is what gives the 404
                    the level-1 heading every other route has.
                    ServerError and RouteError keep the <div> — they render
                    *inside* a route that already owns an h1, so promoting
                    theirs would put two on the page. .error-label out-specifies
                    the bare h1 element rules in style.css, so nothing about
                    the rendering changes. */}
                <h1 className="error-label">Page not found</h1>
                <p className="error-desc">
                    The page you’re looking for doesn’t exist. <Link to="/">Return home</Link>.
                </p>
            </div>
        </div>
    </section>
)

export default NotFound
