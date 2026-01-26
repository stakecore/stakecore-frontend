import React from "react"

type MovieClipProps = {
  videoId: string;
}

class MovieClip extends React.Component<MovieClipProps> {

  render() {
    const options = {
      hostname: 'https://www.youtube-nocookie.com',
      playerVars: {
        autoplay: 1,
        controls: 1
      }
    }
    return <div className="video-container">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${this.props.videoId}`}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  }

  _onReady(event: any) {
    event.target.pauseVideo()
  }
}

export default MovieClip;