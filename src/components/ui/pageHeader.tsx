import type { ReactNode } from "react"
import './pageHeader.scss'

// The site's title standard, in one place. Before this component the same
// suptitle + title block was hand-built in seven files, and the files said so
// themselves — news.scss carried the comment "Matches .about-header-main and
// .contact-header-main exactly". A comment asserting that is a shared
// component with the extraction step missing.
//
// `variant` is one decision that fixes five things at once: display ramp,
// heading level, max-width, line-height and body size. Only heading level and
// body size were already perfectly correlated across the seven copies; display
// ramp, max-width and line-height each had a dissenter and are normalised to
// the majority value on purpose. Binding heading level to the variant means a
// call site cannot pick a size that contradicts its place in the document
// outline, which keeps the heading-order a11y rule satisfied by construction.
const PageHeader = ({ variant = 'page', supTitle, title, align = 'start', aside, children }: {
  variant?: 'page' | 'section'
  supTitle?: string
  // Renderable rather than a string: /about wraps words in
  // <span className="about-mark">, and a string prop would push that call site
  // back to hand-built markup — reopening the drift this component closes.
  title: ReactNode
  align?: 'start' | 'center'
  // Page-level controls, rendered below the title stack. Currently the
  // multi-validator dropdown on the two validator pages.
  aside?: ReactNode
  // Body copy beneath the title, rendered into a <p> because both current
  // consumers are a single paragraph of inline content. Sized by variant.
  children?: ReactNode
}) => {
  const Heading = variant === 'page' ? 'h1' : 'h2'
  const className = [
    'page-header',
    variant === 'section' && 'page-header--section',
    align === 'center' && 'page-header--center',
    aside && 'page-header--with-aside',
  ].filter(Boolean).join(' ')

  return (
    <header className={className}>
      <div className="page-header-text">
        {supTitle && <p className="page-header-sup">{supTitle}</p>}
        <Heading className="page-header-main">{title}</Heading>
        {children && <p className="page-header-body">{children}</p>}
      </div>
      {aside && <div className="page-header-aside">{aside}</div>}
    </header>
  )
}

export default PageHeader
