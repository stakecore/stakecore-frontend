import type { ReactNode } from "react"

// `rightSlot` floats top-right of the title block — used by the validator
// pages for the multi-validator dropdown. Wraps below the title on
// narrow viewports via flex-wrap so the h1 keeps its full width.
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
