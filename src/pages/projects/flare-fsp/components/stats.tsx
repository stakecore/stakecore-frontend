import { SpinnerCircular } from "spinners-react"
import { ResponsiveLine } from '@nivo/line'
import { FlareFspDataLayer } from "../data"
import { LoadingStatus, useDataLoader } from "~/components/utils/loader"
import { FLARE_COLOR_CODE } from "~/utlits/data/constants"


const MyLine = ({ data /* see data tab */ }) => (
  <ResponsiveLine /* or Line for fixed dimensions */
    data={data}
    xFormat="time:%Y-%m-%d"
    xScale={{ type: 'time', format: 'native', precision: 'day' }}
    yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: true, reverse: false }}
    pointSize={10}
    pointColor={{ theme: 'background' }}
    pointBorderWidth={2}
    pointBorderColor={{ from: 'seriesColor' }}
    enableGridX={false}
    enableGridY={false}
    pointLabelYOffset={-15}
    enableTouchCrosshair={true}
    useMesh={true}
    legends={[
      {
        anchor: 'bottom-right',
        direction: 'column',
        translateX: 100,
        itemWidth: 80,
        itemHeight: 22,
        symbolShape: 'circle'
      }
    ]}
  />
)

const FlareFspStatsComponent = () => {
  const { data, status, error } = useDataLoader(FlareFspDataLayer.getGraphicsData)

  let component = null
  if (status == LoadingStatus.NONE || status == LoadingStatus.LOADING) {
    component = <>
      <div style={{ textAlign: 'center' }} className="mt-30 mb-30" >
        <SpinnerCircular color={FLARE_COLOR_CODE} size={100} />
      </div>
    </>
  } else {
    const d = [{
      id: 'Flare Fsp Delegation TimeSeries',
      data: data.result.map(({ timestamp, value }) => ({
        x: new Date(timestamp * 1000),
        y: Number(BigInt(value) / (BigInt(10) ** BigInt(18)))
      }))
    }]
    component = <>
      <div className="single-project-page-right wow fadeInUp delay-0-4s avalanche-div-border mt-30">
        <h2>Stakecore Statistics</h2>
        <div style={{ height: 200 }}>
          <MyLine data={d} />
        </div>
      </div>
    </>
  }

  return component
}

export default FlareFspStatsComponent