// @vitest-environment happy-dom

import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup } from '@testing-library/react'

vi.mock('react-toastify', () => ({
  toast: Object.assign(vi.fn(), { loading: vi.fn(() => 1), update: vi.fn() }),
}))
vi.mock('../../../backendApi', () => ({
  LandingPageService: { pageControllerSubmitForm: vi.fn() },
}))

import ContactForm from './contactForm'

afterEach(cleanup)

// Each control used to carry two <label for=...> elements: the visible one and
// a second wrapping a Font Awesome <i>. Two labels for one control is
// WCAG 3.3.2 / axe's form-field-multiple-labels — assistive tech concatenates
// them, and which one wins is not specified. The icon labels were also dead
// markup: `far fa-user` is Font Awesome, which this project does not load
// (it uses @remixicon/react), so they rendered nothing at all.
describe('ContactForm labelling', () => {
  it.each(['name', 'email', 'message'])('associates exactly one label with #%s', (id) => {
    const { container } = render(<ContactForm />)

    expect(container.querySelectorAll(`label[for="${id}"]`)).toHaveLength(1)
  })

  it('carries no Font Awesome icon markup, which never rendered', () => {
    const { container } = render(<ContactForm />)

    expect(container.querySelectorAll('i.far')).toHaveLength(0)
  })
})
