import { Link } from 'react-router-dom'

const NotFound = () => (
    <section className="innerpage-single-area">
        <div className="container">
            <div className="error-container">
                <div className="error-status">404</div>
                <div className="error-label">Page not found</div>
                <p className="error-desc">
                    The page you’re looking for doesn’t exist. <Link to="/">Return home</Link>.
                </p>
            </div>
        </div>
    </section>
)

export default NotFound
