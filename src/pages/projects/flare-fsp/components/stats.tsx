import useSWR from "swr"
import { SpinnerCircular } from "spinners-react"
import { FlareFspDataLayer } from "../data"
import { FLARE_COLOR_CODE } from "~/utlits/data/constants"
import { ResponsiveLine } from "@nivo/line"
import { Formatter } from "~/utlits/misc/formatter"


const FlareFspStatsComponent = () => {
  const { data, error, isLoading } = useSWR('flare-fsp-graphics', (x) => FlareFspDataLayer.getGraphicsData() )

  let component = null
  if (isLoading) {
    component = <>
      <div style={{ textAlign: 'center' }} className="mt-30 mb-30" >
        <SpinnerCircular color={FLARE_COLOR_CODE} size={100} />
      </div>
    </>
  } else if (error != null || data == null) {
    component = <div>error {error}</div>
  } else {
    const d1 = [
      {
        id: 'FLR Delegated',
        data: data.delegations.result.map(({ rewardEpoch: x, delegated: y }) => ({ x, y }))
      }
    ]
    const d2 = [
      {
        id: 'Flare Delegators',
        data: data.delegations.result.map(({ rewardEpoch: x, delegators: y }) => ({ x, y }))
      }
    ]

    component = <>
      <div className="single-project-page-right wow fadeInUp delay-0-4s avalanche-div-border mt-30">
        <h2>Stakecore Statistics</h2>
        <p>
          We show statistics for the last 25 reward epochs. Note that a reward epoch on Flare Network
          lasts 3.5 days.
        </p>
        <div className="row">
          <div style={{ border: '2px solid powderblue' }}>
            <div>
              <p>Amount of (wrapped) FLR delegated to Stakecore.</p>
            </div>
          </div>
          <div style={{ height: 250 }}>
            <ResponsiveLine
              data={d1}
              axisTop={null}
              axisBottom={null}
              axisLeft={null}
              axisRight={null}
              yFormat={v => Formatter.smartFormat(Math.floor(v), 0)}
              margin={{ top: 30, right: 20, bottom: 20, left: 20 }}
              yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: false }}
              pointSize={10}
              pointColor='black'
              colors='white'
              pointBorderWidth={2}
              pointBorderColor={{ from: 'seriesColor' }}
              enablePointLabel={true}
              enableGridX={false}
              enableGridY={false}
              pointLabelYOffset={-15}
              enableTouchCrosshair={true}
              useMesh={true}
            />
          </div>
        </div>
        <div>
          <h6>Delegators</h6>
          <p>Number FLR delegators delegating to Stakecore</p>
          <div style={{ height: 250 }}>
            <ResponsiveLine
              data={d2}
              axisTop={null}
              axisBottom={null}
              axisLeft={null}
              axisRight={null}
              margin={{ top: 30, right: 20, bottom: 20, left: 20 }}
              yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: false }}
              pointSize={10}
              pointColor='black'
              colors='white'
              pointBorderWidth={2}
              pointBorderColor={{ from: 'seriesColor' }}
              enablePointLabel={true}
              enableGridX={false}
              enableGridY={false}
              pointLabelYOffset={-15}
              enableTouchCrosshair={true}
              useMesh={true}
            />
          </div>
        </div>
      </div>
    </>
  }

  return component
}

export default FlareFspStatsComponent