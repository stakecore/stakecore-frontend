// @vitest-environment happy-dom

import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import PageHeader from './pageHeader'

afterEach(cleanup)

describe('PageHeader', () => {
  it('renders a level-1 heading for the page variant', () => {
    render(<PageHeader variant="page" supTitle="About" title="Your stake, our engine" />)
    expect(screen.getByRole('heading', { level: 1, name: 'Your stake, our engine' })).toBeTruthy()
  })

  it('renders a level-2 heading for the section variant', () => {
    render(<PageHeader variant="section" supTitle="Who we serve" title="From personal wallets" />)
    expect(screen.getByRole('heading', { level: 2, name: 'From personal wallets' })).toBeTruthy()
  })

  it('defaults to the page variant', () => {
    render(<PageHeader title="Get in touch" />)
    expect(screen.getByRole('heading', { level: 1, name: 'Get in touch' })).toBeTruthy()
  })

  it('renders the suptitle when supplied', () => {
    const { container } = render(<PageHeader supTitle="News" title="What's new" />)
    expect(container.querySelector('.page-header-sup')?.textContent).toBe('News')
  })

  it('omits the suptitle when the prop is absent', () => {
    const { container } = render(<PageHeader variant="section" title="Earn Yield" />)
    expect(container.querySelector('.page-header-sup')).toBeNull()
  })

  it('renders a ReactNode title with its nested markup intact', () => {
    render(
      <PageHeader
        variant="section"
        title={<>Small, robust, and <span className="about-mark">decentralized</span></>}
      />,
    )
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading.querySelector('.about-mark')?.textContent).toBe('decentralized')
  })

  it('renders the body only when children are supplied', () => {
    const { container: without } = render(<PageHeader title="Bare" />)
    expect(without.querySelector('.page-header-body')).toBeNull()
    cleanup()
    const { container: with_ } = render(<PageHeader title="Bodied">Some copy</PageHeader>)
    expect(with_.querySelector('.page-header-body')?.textContent).toBe('Some copy')
  })

  it('renders the aside only when supplied', () => {
    const { container: without } = render(<PageHeader title="Bare" />)
    expect(without.querySelector('.page-header-aside')).toBeNull()
    cleanup()
    const { container: with_ } = render(
      <PageHeader title="Flare Validator" aside={<button type="button">Pick</button>} />,
    )
    expect(with_.querySelector('.page-header-aside')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Pick' })).toBeTruthy()
  })

  it('applies the section modifier class only for the section variant', () => {
    const { container: page } = render(<PageHeader variant="page" title="A" />)
    expect(page.querySelector('.page-header--section')).toBeNull()
    cleanup()
    const { container: section } = render(<PageHeader variant="section" title="B" />)
    expect(section.querySelector('.page-header--section')).toBeTruthy()
  })

  it('applies the center modifier class only when align is center', () => {
    const { container: start } = render(<PageHeader variant="section" title="A" />)
    expect(start.querySelector('.page-header--center')).toBeNull()
    cleanup()
    const { container: centered } = render(
      <PageHeader variant="section" align="center" title="Earn Yield" />,
    )
    expect(centered.querySelector('.page-header--center')).toBeTruthy()
  })

  it('applies the with-aside modifier class only when an aside is supplied', () => {
    const { container: without } = render(<PageHeader title="A" />)
    expect(without.querySelector('.page-header--with-aside')).toBeNull()
    cleanup()
    const { container: with_ } = render(<PageHeader title="B" aside={<span>x</span>} />)
    expect(with_.querySelector('.page-header--with-aside')).toBeTruthy()
  })
})
