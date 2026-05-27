import { Link } from 'react-router-dom'
import './footer.scss'

const Footer = () => {
    const year = new Date().getFullYear()
    return (
        <footer className="main-footer">
            <div className="container">
                <p className="footer-risk">
                    <span className="footer-risk-label">Risk warning.</span>{' '}
                    Crypto-assets are highly volatile. Staking involves significant risks
                    and may result in partial or total loss of your assets, including
                    through validator slashing, network failures, or protocol changes.
                    Nothing on this site constitutes investment, legal, tax, or financial
                    advice. Crypto-assets are largely unregulated and are not covered by
                    deposit guarantee or investor compensation schemes.
                </p>
                <div className="footer-meta">
                    <Link to="/" className="footer-mark">Stakecore</Link>
                    <span className="footer-copy">© {year} Stakecore. All rights reserved.</span>
                </div>
            </div>
        </footer>
    )
}

export default Footer
