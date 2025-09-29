import React from "react"
import YouTube from "react-youtube"

type MovieClipProps = {
  videoId: string;
}

class MovieClip extends React.Component<MovieClipProps> {

  render() {
    const options = {
      playerVars: {
        autoplay: 1,
        controls: 1
      }
    }
    return <YouTube videoId={this.props.videoId} opts={options} onReady={this._onReady} id="video" />
  }

  _onReady(event: any) {
    event.target.pauseVideo()
  }
}

export default MovieClip;