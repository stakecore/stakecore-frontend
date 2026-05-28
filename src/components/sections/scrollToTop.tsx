import { useEffect } from "react"
import { useLocation } from "react-router-dom"

const ScrollToTop = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    // Respect prefers-reduced-motion — jump instantly for users who
    // opt out of animation; smooth-scroll for everyone else.
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({
      top: 0,
      behavior: reduced ? "auto" : "smooth"
    })
  }, [pathname])

  return null
}

export default ScrollToTop