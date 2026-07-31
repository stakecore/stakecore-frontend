import type { ReactNode } from "react"

// `rightSlot` renders below the title block — used by the validator
// pages for the multi-validator dropdown. See .project-title in
// protocols.scss: the stack is a column at every viewport, so the slot
// stays put regardless of how long the title is.
const ProjectTitle = ({ title, suptitle, rightSlot }: {
  title: string
  suptitle: string
  rightSlot?: ReactNode
}) => {
  return (
    <div className="container">
      <header className="project-title">
        <div className="project-title-text">
          <p className="project-title-sup">{suptitle}</p>
          <h1 className="project-title-main">{title}</h1>
        </div>
        {rightSlot && <div className="project-title-aside">{rightSlot}</div>}
      </header>
    </div>
  )
}

export default ProjectTitle
