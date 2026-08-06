import { sleep } from "./misc/time"

// #overlay is a static element in index.html, alongside #root and #eip6963.
// It is still looked up defensively: this runs from an effect in the wallet
// picker, and a missing element would otherwise throw there and take the
// picker — and the route rendering it — down with it. Dimming the backdrop is
// cosmetic; it is not worth a crash.
export function changeOpacity(add: boolean) {
    const overlay = document.getElementById("overlay")
    if (overlay == null) return
    add ? addOverlay(overlay) : removeOverlay(overlay)
}

function addOverlay(overlay: HTMLElement) {
    overlay.style.visibility = "visible"
    overlay.style.opacity = "0.8"
}

function removeOverlay(overlay: HTMLElement) {
    overlay.style.opacity = "0"
    sleep(500).then(() => {
        overlay.style.visibility = "hidden"
    })
}
