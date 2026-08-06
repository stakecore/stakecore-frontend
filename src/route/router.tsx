import { createHashRouter } from "react-router";
import RootLayout from "../layout/root";
import Home from "../pages/home";
import NotFound from "../pages/notFound";
import { routeLazy, RouteHydrateFallback } from "./lazy";
import RouteError from "./routeError";

// Every child route carries the same boundary. On the *child* rather than the
// root so a crash renders into RootLayout's <Outlet /> with the header, footer
// and wallet UI still mounted — a root-level boundary replaces the layout
// itself, so one bad component would take the whole chrome with it.
const lazyRoute = (path, factory) => ({
    path,
    lazy: routeLazy(path, factory),
    errorElement: <RouteError />
})

export const router = createHashRouter([
    {
        path: "/",
        element: <RootLayout />,
        HydrateFallback: RouteHydrateFallback,
        // Backstop for throws in RootLayout itself (header, footer, the chain
        // -switch effect) — nothing above this point can catch those.
        errorElement: <RouteError />,
        children: [
            { path: "/", element: <Home />, errorElement: <RouteError /> },
            lazyRoute("/contact", () => import("../pages/contact")),
            lazyRoute("/about", () => import("../pages/about")),
            lazyRoute("/avalanche/validator", () => import("../pages/protocols/avalanche-validator/page")),
            lazyRoute("/flare/validator", () => import("../pages/protocols/flare-validator/page")),
            lazyRoute("/flare/fsp", () => import("../pages/protocols/flare-fsp/page")),
            lazyRoute("/songbird/fsp", () => import("../pages/protocols/songbird-fsp/page")),
            { path: "*", element: <NotFound />, handle: { hideCallToAction: true }, errorElement: <RouteError /> }
        ]
    }
])
