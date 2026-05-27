const ProjectTitle = ({ title, suptitle }) => {
  return (
    <div className="container">
      <header className="project-title">
        <p className="project-title-sup">{suptitle}</p>
        <h1 className="project-title-main">{title}</h1>
      </header>
    </div>
  )
}

export default ProjectTitle
