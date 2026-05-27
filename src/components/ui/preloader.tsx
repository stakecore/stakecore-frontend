// Static loader: shown by NavigationPreloader in root.tsx when a route
// takes longer than 150ms to load. No boot-time intro animation.

const SVG_PATH = "M0,1005S175,995,500,995s500,5,500,5V0H0Z"

const PreloaderHeading = () => (
    <div className="preloader-heading">
        <div className="load-text">
            <span>S</span>
            <span>t</span>
            <span>a</span>
            <span>k</span>
            <span>e</span>
            <span>c</span>
            <span>o</span>
            <span>r</span>
            <span>e</span>
        </div>
    </div>
)

export const PreloaderContent = () => (
    <>
        <svg viewBox="0 0 1000 1000" preserveAspectRatio="none">
            <path d={SVG_PATH} />
        </svg>
        <PreloaderHeading />
    </>
)
