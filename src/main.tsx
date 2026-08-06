import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
// Only Bootstrap's reboot is still third-party (base normalizations the
// custom CSS relies on — global box-sizing, button font inheritance, etc.).
// The full framework shipped ~230 kB of component CSS (buttons, cards,
// navbar, forms, modals…) that this app never uses, and bootstrap-grid was a
// further 51.8 kB of render-blocking CSS for ~13 class usages — grid.scss
// reimplements exactly those.
import "bootstrap/dist/css/bootstrap-reboot.min.css"
import "./assets/css/grid.scss"
import 'react-tooltip/dist/react-tooltip.css'
import './assets/css/index.scss'

// #root is a static element in index.html. If it is ever missing, React's own
// failure is an opaque "Target container is not a DOM element" — this names
// the actual cause instead, and is the only thing standing between a bad
// index.html and a silently blank page.
const container = document.getElementById('root')
if (container == null) {
  throw new Error('Mount failed: #root is missing from index.html')
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
