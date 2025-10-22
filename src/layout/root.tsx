import { Outlet, useLocation } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import { chainFromRoute } from '../utlits/misc/translations'
import Header from '../components/sections/header'
import Footer from '../components/sections/footer'
import CallToAction from '../components/sections/callToAction'
import Preloader from '../components/ui/preloader'
import DiscoverWalletProviders from '../components/sections/eip6963'
import ScrollToTop from '../components/sections/scrollToTop'

function chainToClassName(chain: string): string {
    return chain != null ? `background background-${chain}` : ''
}

const RootLayout = () => {
    const { pathname } = useLocation()
    const chain = chainFromRoute(pathname)
    const classname = chainToClassName(chain)

    return (
        <>
            <Preloader />
            <Header />
            <div className={classname}>
                <Outlet />
                <CallToAction />
                <Footer />
            </div>
            <ToastContainer theme='dark' position='top-left' />
            <DiscoverWalletProviders />
            <ScrollToTop />
        </>
    )
}

export default RootLayout