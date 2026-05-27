import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { RiGithubLine, RiSendPlaneLine, RiTwitterXLine } from '@remixicon/react'
import profile from '../../assets/images/about/profile.svg'
import { menuList } from '../../utils/data/menu'
import { useGlobalStore } from '../../utils/store/global'
import { Formatter } from '../../utils/misc/formatter'
import './header.scss'


const ChooseWalletButton = () => {
    const walletProvider = useGlobalStore(state => state.walletProvider)
    const walletAddress = useGlobalStore(state => state.walletAddress)
    const setWalletChoiceVisible = useGlobalStore(state => state.setWalletChoiceVisible)

    return <button type="button" onClick={() => setWalletChoiceVisible(true)} className="theme-btn connect-wallet-button">
        {walletProvider && <img src={walletProvider.info.icon} alt={walletProvider.info.name} />}
        {walletAddress ? Formatter.address(walletAddress) : "Connect Wallet"}
    </button>
}

const Header = () => {
    const pathName = useLocation().pathname
    const [isSticky, setisSticky] = useState(false)
    const [openDropdown, setOpenDropdown] = useState(null)

    useEffect(() => {
        const navbar_collapse = document.querySelector(".navbar-collapse")
        navbar_collapse.classList.remove("show")
        setOpenDropdown(null)
    }, [pathName])

    useEffect(() => {
        if (openDropdown == null) return
        const onClickOutside = (e) => {
            if (!e.target.closest('.has-submenu')) setOpenDropdown(null)
        }
        const onEscape = (e) => {
            if (e.key === 'Escape') setOpenDropdown(null)
        }
        document.addEventListener('click', onClickOutside)
        document.addEventListener('keydown', onEscape)
        return () => {
            document.removeEventListener('click', onClickOutside)
            document.removeEventListener('keydown', onEscape)
        }
    }, [openDropdown])

    const stickyHeader = () => {
        const scrollTop = window.scrollY
        if (scrollTop > 85) {
            setisSticky(true)
        }
        else {
            setisSticky(false)
        }
    }

    useEffect(() => {
        window.addEventListener("scroll", stickyHeader)
        return () => window.removeEventListener("scroll", stickyHeader)
    }, [])

    return (
        <header className={`main-header ${isSticky ? "fixed-header" : ""}`}>
            <div className="header-upper">
                <div className="container-fluid">
                    <div className="header-inner d-flex align-items-center">
                        <div className="logo-outer">
                            <div className="logo">
                                <Link to="/" aria-label="Stakecore home">
                                    <img src={profile} alt="" className="logo-mark" />
                                </Link>
                            </div>
                        </div>
                        <div className="nav-outer clearfix mx-auto">
                            <nav className="main-menu navbar-expand-lg">
                                <div className="navbar-header">
                                    <div className="mobile-logo">
                                        <Link to="/" aria-label="Stakecore home">
                                            <img src={profile} alt="" className="logo-mark" />
                                        </Link>
                                    </div>
                                    <button type="button" className="navbar-toggle" data-bs-toggle="collapse" data-bs-target=".navbar-collapse">
                                        <span className="icon-bar"></span>
                                        <span className="icon-bar"></span>
                                        <span className="icon-bar"></span>
                                    </button>
                                </div>
                                <div className="navbar-collapse collapse">
                                    <ul className="navigation onepage clearfix">
                                        {menuList.map((item) => (
                                            item.children ? (
                                                <li key={item.id} className={`has-submenu${openDropdown === item.id ? ' open' : ''}`}>
                                                    <button
                                                        type="button"
                                                        className={`nav-link-click submenu-toggle${item.children.some(c => c.path === pathName) ? ' active' : ''}`}
                                                        aria-haspopup="true"
                                                        aria-expanded={openDropdown === item.id}
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setOpenDropdown(openDropdown === item.id ? null : item.id)
                                                        }}
                                                    >
                                                        {item.label}
                                                        <span aria-hidden="true" className="submenu-caret" />
                                                    </button>
                                                    <ul className="submenu-list">
                                                        {item.children.map((child) => (
                                                            <li key={child.id}>
                                                                <NavLink to={child.path} onClick={() => setOpenDropdown(null)} className={({ isActive }) => `nav-link-click${isActive ? ' active' : ''}`}>
                                                                    {child.label}
                                                                </NavLink>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </li>
                                            ) : (
                                                <li key={item.id}>
                                                    <NavLink to={item.path} end={item.path === '/'} className={({ isActive }) => `nav-link-click${isActive ? ' active' : ''}`}>
                                                        {item.label}
                                                    </NavLink>
                                                </li>
                                            )
                                        ))}
                                    </ul>
                                    <ul className="drawer-social">
                                        <li><Link target="_blank" to="https://x.com/stake_core" aria-label="X"><RiTwitterXLine size={18} /></Link></li>
                                        <li><Link target="_blank" to="https://t.me/+xZoChBQyyCo3OGY0" aria-label="Telegram"><RiSendPlaneLine size={18} /></Link></li>
                                        <li><Link target="_blank" to="https://github.com/stakecore" aria-label="GitHub"><RiGithubLine size={18} /></Link></li>
                                    </ul>
                                </div>
                            </nav>
                        </div>
                        <div className="menu-btns">
                            <ul className="header-social">
                                <li><Link target="_blank" to="https://x.com/stake_core" aria-label="X"><RiTwitterXLine size={16} /></Link></li>
                                <li><Link target="_blank" to="https://t.me/+xZoChBQyyCo3OGY0" aria-label="Telegram"><RiSendPlaneLine size={16} /></Link></li>
                                <li><Link target="_blank" to="https://github.com/stakecore" aria-label="GitHub"><RiGithubLine size={16} /></Link></li>
                            </ul>
                            <ChooseWalletButton />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Header