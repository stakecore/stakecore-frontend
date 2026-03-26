import { useEffect } from "react"
import { motion, useAnimation } from "framer-motion"

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

const Preloader = () => {
    const controls = useAnimation()

    useEffect(() => {
        const animate = async () => {
            const curve = "M0 502S175 272 500 272s500 230 500 230V0H0Z"
            const flat = "M0 2S175 1 500 1s500 1 500 1V0H0Z"

            // Initial animation
            await controls.start({
                opacity: 0,
                y: -100,
                transition: { delay: 1.5, duration: 0.5, ease: "easeInOut" },
            })

            // Morphing path animation
            await controls.start({
                d: curve,
                transition: { duration: 0.5, ease: "easeIn" },
            })

            await controls.start({
                d: flat,
                transition: { duration: 0.5, ease: "easeOut" },
            })

            // Hide preloader
            await controls.start({
                y: -1500,
                transition: { duration: 0.5, ease: "easeInOut" },
            })

            // Set preloader display to none
            await controls.start({
                zIndex: -1,
                display: "none",
                transition: { duration: 0.1 },
            })
        }

        animate()
    }, [controls])

    return (
        <motion.div className="preloader" animate={controls}>
            <svg viewBox="0 0 1000 1000" preserveAspectRatio="none">
                <motion.path
                    id="preloaderSvg"
                    d={SVG_PATH}
                    animate={controls}
                />
            </svg>
            <PreloaderHeading />
        </motion.div>
    )
}

export default Preloader
