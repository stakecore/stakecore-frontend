export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export function secondsUntil(unix: number): number {
    const end = new Date(1000 * unix).getTime()
    return Math.floor((end - Date.now()) / 1000)
}