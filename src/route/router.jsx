import { createHashRouter } from "react-router-dom";
import RootLayout from "../layout/root";
import Home from "../pages/home";
import Contact from "../pages/contact";
import About from "../pages/about";
import AvalancheValidatorProject from "../pages/protocols/avalanche-validator/page";
import FlareValidatorProject from "../pages/protocols/flare-validator/page";
import FlareFspProject from "../pages/protocols/flare-fsp/page";
import SongbirdFspProject from "../pages/protocols/songbird-fsp/page";
import Protocols from "../pages/protocols";


export const router = createHashRouter([
    {
        path: "/",
        element: <RootLayout />,
        children: [
            {
                path: "/",
                element: <Home />
            },
            {
                path: "/contact",
                element: <Contact />
            },
            {
                path: "/about",
                element: <About />
            },
            /* {
                path: "/service",
                element: <Service />
            }, */
            {
                path: "/protocols",
                element: <Protocols />
            },
            {
                path: "/avalanche/validator",
                element: <AvalancheValidatorProject />
            },
            {
                path: "/flare/validator",
                element: <FlareValidatorProject />
            },
            {
                path: "/flare/fsp",
                element: <FlareFspProject />
            },
            {
                path: "/songbird/fsp",
                element: <SongbirdFspProject />
            }
        ]
    }
])