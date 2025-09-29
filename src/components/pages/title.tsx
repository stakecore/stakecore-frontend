const ProjectTitle = ({ title, suptitle}) => {
  return (
    <div className="container">
      <div className="row">
        <div className="col-lg-12 text-center pb-30">
          <p>{suptitle}</p>
          <h1>{title}</h1>
        </div>
      </div>
    </div>
  )
}

export default ProjectTitle