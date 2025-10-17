import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import './assets/css/spacing.css'
import './assets/css/style.css'
import './assets/css/responsive.css'
import './assets/css/custom.css'
import './assets/css/wallet.css'
import './assets/css/meterBar.css'
import './assets/css/countdown.css'
import './assets/css/tooltip.css'
import './assets/css/investFlow.scss'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
