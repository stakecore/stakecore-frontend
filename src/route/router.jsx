import { createHashRouter } from "react-router-dom";
import RootLayout from "../layout/root";
import Home from "../pages/home";
import Lazy, { lazyWithReload } from "./lazy";

const Contact = lazyWithReload(() => import("../pages/contact"));
const About = lazyWithReload(() => import("../pages/about"));
const Protocols = lazyWithReload(() => import("../pages/protocols"));
const AvalancheValidatorProject = lazyWithReload(() => import("../pages/protocols/avalanche-validator/page"));
const FlareValidatorProject = lazyWithReload(() => import("../pages/protocols/flare-validator/page"));
const FlareFspProject = lazyWithReload(() => import("../pages/protocols/flare-fsp/page"));
const SongbirdFspProject = lazyWithReload(() => import("../pages/protocols/songbird-fsp/page"));


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
                element: <Lazy><Contact /></Lazy>
            },
            {
                path: "/about",
                element: <Lazy><About /></Lazy>
            },
            {
                path: "/protocols",
                element: <Lazy><Protocols /></Lazy>
            },
            {
                path: "/avalanche/validator",
                element: <Lazy><AvalancheValidatorProject /></Lazy>
            },
            {
                path: "/flare/validator",
                element: <Lazy><FlareValidatorProject /></Lazy>
            },
            {
                path: "/flare/fsp",
                element: <Lazy><FlareFspProject /></Lazy>
            },
            {
                path: "/songbird/fsp",
                element: <Lazy><SongbirdFspProject /></Lazy>
            }
        ]
    }
])
