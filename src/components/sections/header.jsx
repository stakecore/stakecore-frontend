import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { menuList } from '../../utlits/fackData/menuList'
import { useGlobalStore } from '../../utlits/store/global'
import { Formatter } from '../../utlits/misc/formatter'


const ChooseWalletButton = () => {
    const walletProvider = useGlobalStore((state) => state.walletProvider)
    const walletAddress = useGlobalStore((state) => state.walletAddress)
    const setWalletChoiceVisible = useGlobalStore((state) => state.setWalletChoiceVisible)
    return <Link onClick={(event) => {
        event.preventDefault()
        setWalletChoiceVisible(true)
    }} className="theme-btn connect-wallet-button">
        {walletProvider ? <img src={walletProvider.info.icon} alt={walletProvider.info.name} /> : null}
        {walletAddress ? Formatter.address(walletAddress) : "Connect Wallet"}
    </Link>
}

const Header = () => {
    const pathName = useLocation().pathname
    const [isSticky, setisSticky] = useState(false)

    useEffect(() => {
        const navbar_collapse = document.querySelector(".navbar-collapse")
        navbar_collapse.classList.remove("show")
    }, [pathName])

    useEffect(() => {
        window.addEventListener("scroll", stickyHeader)
        return () => window.removeEventListener("scroll", stickyHeader)
    }, [])

    const stickyHeader = () => {
        const scrollTop = window.scrollY
        if (scrollTop > 85) {
            setisSticky(true)
        }
        else {
            setisSticky(false)
        }
    }

    return (
        <header className={`main-header ${isSticky ? "fixed-header" : ""}`}>
            <div className="header-upper">
                <div className="container">
                    <div className="header-inner d-flex align-items-center">
                        {/* <!-- START LOGO DESIGN AREA --> */}
                        <div className="logo-outer">
                            <div className="logo">
                                <Link to="/"><span>STAKECORE</span></Link>
                            </div>
                        </div>
                        {/* <!-- / END LOGO DESIGN AREA -->
                        <!-- START NAV DESIGN AREA --> */}
                        <div className="nav-outer clearfix mx-auto">
                            {/* <!-- Main Menu --> */}
                            <nav className="main-menu navbar-expand-lg">
                                <div className="navbar-header">
                                    <div className="mobile-logo">
                                        <Link to="/"><span>STAKECORE</span> </Link>
                                    </div>
                                    {/* <!-- Toggle Button --> */}
                                    <button type="button" className="navbar-toggle" data-bs-toggle="collapse" data-bs-target=".navbar-collapse">
                                        <span className="icon-bar"></span>
                                        <span className="icon-bar"></span>
                                        <span className="icon-bar"></span>
                                    </button>
                                </div>
                                <div className="navbar-collapse collapse">
                                    <ul className="navigation onepage clearfix">
                                        {
                                            menuList.map(({ id, label, path }) => <li key={id}><Link to={path} className="nav-link-click" >{label}</Link></li>)
                                        }
                                    </ul>
                                </div>
                            </nav>

                        </div>
                        <div className="menu-btns">
                            <ChooseWalletButton />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Header