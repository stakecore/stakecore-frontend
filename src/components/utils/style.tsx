import { sleep } from "../../utils/misc/time"

export function changeOpacity(add: boolean) {
    const overlay = document.getElementById("overlay")
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