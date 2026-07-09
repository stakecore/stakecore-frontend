import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
// Only Bootstrap's reboot (base normalizations the custom CSS relies on —
// global box-sizing, button font inheritance, etc.) and the grid/used
// utilities are needed. The full framework shipped ~230 kB of component CSS
// (buttons, cards, navbar, forms, modals…) that this app never uses.
import "bootstrap/dist/css/bootstrap-reboot.min.css"
import "bootstrap/dist/css/bootstrap-grid.min.css"
import 'react-tooltip/dist/react-tooltip.css'
import './assets/css/index.scss'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
