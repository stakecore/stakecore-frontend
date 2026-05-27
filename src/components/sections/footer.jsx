import { Link } from 'react-router-dom'
import './footer.scss'

const Footer = () => {
    const year = new Date().getFullYear()
    return (
        <footer className="main-footer">
            <div className="container">
                <p className="footer-risk">
                    <span className="footer-risk-label">Risk warning.</span>{' '}
                    Crypto-assets are highly volatile and their value may fluctuate
                    significantly. The staking protocols offered by Stakecore are
                    non-slashing, but staked assets may still be affected by network
                    failures, protocol changes, or other network-wide issues. Nothing on
                    this site constitutes investment, legal, tax, or financial advice.
                    Crypto-assets are largely unregulated and are not covered by deposit
                    guarantee or investor compensation schemes.
                </p>
                <div className="footer-meta">
                    <Link to="/" className="footer-mark">Stakecore</Link>
                    <span className="footer-copy">© {year} Sarisoma d.o.o. All rights reserved.</span>
                </div>
            </div>
        </footer>
    )
}

export default Footer
