// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, Outlet } from 'react-router'
import RouteError from './routeError'

const reload = vi.fn()
let errSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  sessionStorage.clear()
  reload.mockClear()
  Object.defineProperty(window.location, 'reload', { value: reload, configurable: true })
  // React logs the caught error, and the boundary logs it deliberately.
  // Neither is the behaviour under test.
  errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  cleanup()
  errSpy.mockRestore()
})

// Mounts a route that throws `error` during render, with RouteError as its
// boundary, nested under a layout so we can assert the chrome survives.
const renderThrowing = (error: unknown) => {
  const Boom = () => { throw error }
  const router = createMemoryRouter([
    {
      path: '/',
      element: <><header>site chrome</header><Outlet /></>,
      children: [{ index: true, element: <Boom />, errorElement: <RouteError /> }],
    },
  ], { initialEntries: ['/'] })
  return render(<RouterProvider router={router} />)
}

describe('RouteError', () => {
  it('renders a generic failure message for an ordinary render error', () => {
    renderThrowing(new TypeError("Cannot read properties of undefined (reading 'map')"))

    expect(screen.getByText(/something went wrong/i)).toBeTruthy()
  })

  it('does not blame a deployment for an ordinary render error', () => {
    // The bug this guards: ChunkLoadError doubled as the render-error boundary,
    // so a formatter crash told the user to reload for a new version — a wrong
    // diagnosis, and reloading does not fix it.
    renderThrowing(new TypeError('x is not a function'))

    expect(screen.queryByText(/new version/i)).toBeNull()
  })

  it('blames a deployment for a failed dynamic import', () => {
    renderThrowing(new TypeError('Failed to fetch dynamically imported module: /assets/about-a1b2.js'))

    expect(screen.getByText(/new version/i)).toBeTruthy()
  })

  it('keeps the surrounding layout chrome when a child route throws', () => {
    // The boundary sits on the child route, so it renders into the layout's
    // Outlet. On the root route it would replace the header and footer too.
    renderThrowing(new Error('boom'))

    expect(screen.getByText('site chrome')).toBeTruthy()
  })

  it('reloads the page when the reload button is pressed', () => {
    renderThrowing(new Error('boom'))

    fireEvent.click(screen.getByRole('button', { name: /reload/i }))

    expect(reload).toHaveBeenCalledOnce()
  })

  it('clears the chunk-retry flag on reload so the next failure can retry again', () => {
    // routeLazy sets this flag to stop a reload loop. Leaving it set would
    // make a genuinely new chunk failure rethrow instead of retrying once.
    sessionStorage.setItem('stakecore:chunk-reload-attempted', '1')
    renderThrowing(new Error('boom'))

    fireEvent.click(screen.getByRole('button', { name: /reload/i }))

    expect(sessionStorage.getItem('stakecore:chunk-reload-attempted')).toBeNull()
  })

  it('offers a way back home for an ordinary render error', () => {
    // A broken route should not be a dead end when the rest of the site works.
    renderThrowing(new Error('boom'))

    expect(screen.getByRole('link', { name: /home/i })).toBeTruthy()
  })
})
