import { createHashRouter } from "react-router-dom";
import RootLayout from "../layout/root";
import Home from "../pages/home";
import NotFound from "../pages/notFound";
import { routeLazy, ChunkLoadError } from "./lazy";

const lazyRoute = (path, factory) => ({
    path,
    lazy: routeLazy(factory),
    errorElement: <ChunkLoadError />
})

export const router = createHashRouter([
    {
        path: "/",
        element: <RootLayout />,
        children: [
            { path: "/", element: <Home /> },
            lazyRoute("/contact", () => import("../pages/contact")),
            lazyRoute("/about", () => import("../pages/about")),
            lazyRoute("/avalanche/validator", () => import("../pages/protocols/avalanche-validator/page")),
            lazyRoute("/flare/validator", () => import("../pages/protocols/flare-validator/page")),
            lazyRoute("/flare/fsp", () => import("../pages/protocols/flare-fsp/page")),
            lazyRoute("/songbird/fsp", () => import("../pages/protocols/songbird-fsp/page")),
            { path: "*", element: <NotFound />, handle: { hideCallToAction: true } }
        ]
    }
])
