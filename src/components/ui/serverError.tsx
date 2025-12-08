export const ServerError = ({ status, message }) => {
  return <div className='error-container'>
    <div id="error">SERVER ERROR</div>
    <div className="error-num">{ status }
      <div className="error-num__clip">{ status }</div>
    </div>
    <p id="desc">Server failed to return data due to: "{ String(message) }"</p>
  </div>
}

export default ServerError