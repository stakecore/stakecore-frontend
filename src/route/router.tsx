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
//
// `handle.title` is the document title, applied by RootLayout. It lives on the
// route rather than inside each page component for two reasons: it has to be
// set for lazy routes before their chunk resolves, and putting it here keeps
// every title in one list where a duplicate is visible. A hash fragment never
// reaches the server, so index.html's static <title> is what all eight routes
// would otherwise ship — see the note in e2e/fixtures/routes.ts.
//
// `handle` takes any extra route flags RootLayout reads (currently
// `hideContactPrompt`), so a route needing one doesn't have to be spelled out
// longhand and repeat its own title.
const lazyRoute = (path, factory, title, handle = {}) => ({
    path,
    lazy: routeLazy(path, factory),
    handle: { title, ...handle },
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
            // The home page keeps the bare wordmark: it is the site's own
            // page, so "StakeCore — StakeCore" would be the only duplication
            // in the set.
            { path: "/", element: <Home />, handle: { title: "StakeCore" }, errorElement: <RouteError /> },
            // hideContactPrompt: the CallToAction panel's second value proposition
            // links to /contact, so it is suppressed on /contact itself.
            lazyRoute("/contact", () => import("../pages/contact"), "Contact — StakeCore", { hideContactPrompt: true }),
            lazyRoute("/about", () => import("../pages/about"), "About — StakeCore"),
            lazyRoute("/news", () => import("../pages/news"), "News — StakeCore"),
            lazyRoute("/avalanche/validator", () => import("../pages/protocols/avalanche-validator/page"), "Avalanche Validator — StakeCore"),
            lazyRoute("/flare/validator", () => import("../pages/protocols/flare-validator/page"), "Flare Validator — StakeCore"),
            lazyRoute("/flare/fsp", () => import("../pages/protocols/flare-fsp/page"), "Flare Systems Protocol — StakeCore"),
            lazyRoute("/songbird/fsp", () => import("../pages/protocols/songbird-fsp/page"), "Songbird Systems Protocol — StakeCore"),
            { path: "*", element: <NotFound />, handle: { hideCallToAction: true, title: "Page not found — StakeCore" }, errorElement: <RouteError /> }
        ]
    }
])
