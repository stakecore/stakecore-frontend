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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
