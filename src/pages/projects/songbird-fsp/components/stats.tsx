import useSWR from "swr"
import { SpinnerCircular } from "spinners-react"
import { ResponsiveLine } from "@nivo/line"
import FspDataLayer from "../../flare-fsp/data"
import { Formatter } from "~/utlits/misc/formatter"
import { SONGBIRD_COLOR_CODE } from "~/utlits/data/constants"
import MeterBar from "~/components/ui/meterBar"


const FlareFspStatsComponent = () => {
  const { data, error, isLoading } = useSWR('songbird-fsp-graphics', (x) => FspDataLayer.getGraphicsData('songbird'))

  let component = null
  if (isLoading) {
    component = <>
      <div style={{ textAlign: 'center' }} className="mt-30 mb-30" >
        <SpinnerCircular color={SONGBIRD_COLOR_CODE} size={100} />
      </div>
    </>
  } else if (error != null || data == null) {
    component = <div>error {error}</div>
  } else {
    const d1 = [
      {
        id: 'SGB Delegated',
        data: data.delegations.result.map(({ rewardEpoch: x, delegated: y }) => ({ x, y }))
      }
    ]

    const d2 = [
      {
        id: 'Primary Success Rate',
        data: data.submissions.result.map(({ rewardEpoch: x, primary: y }) => ({ x, y }))
      },
/*       {
        id: 'Secondary Success Rate',
        data: data.submissions.result.map(({ rewardEpoch: x, secondary: y }) => ({ x, y }))
      } */
    ]

    const d3 = [
      {
        id: 'SGB Delegators',
        data: data.delegations.result.map(({ rewardEpoch: x, delegators: y }) => ({ x, y }))
      }
    ]

    const last = data.submissions.result[data.submissions.result.length - 1]
    const uptime = Formatter.percent(last.uptime, 1)
    const primary = Formatter.percent(last.primary, 1)
    const secondary = Formatter.percent(last.secondary, 1)

    component = <>
      <div className="single-project-page-right wow fadeInUp delay-0-4s songbird-div-border mt-30">
        <h2>Provider Statistics</h2>
        <p>
          We value transparency, and stream a part of our monitoring to this site,
          so you can see live data of the provider's performance for the current reward epoch {last.rewardEpoch}.
          Below we also display the historical data for some relevant metrics over the past 25 reward epochs (90 days).
        </p>
        <div className="row">
          <div className="col-lg-6">
            <MeterBar name='Primary Success' ranges={[20, 50]} value={100 * last.primary} text={primary} />
            <MeterBar name='Secondary Success' ranges={[80, 95]} value={100 * last.secondary} text={secondary} />
            <MeterBar name='Uptime' ranges={[95, 98]} value={100 * last.uptime} text={uptime} />
          </div>
          <div className="col-lg-6">
            <MeterBar name='Primary Success' ranges={[20, 50]} value={100 * last.primary} text={primary} />
            <MeterBar name='Secondary Success' ranges={[80, 95]} value={100 * last.secondary} text={secondary} />
            <MeterBar name='Uptime' ranges={[95, 98]} value={100 * last.uptime} text={uptime} />
          </div>
        </div>
        <div className="row mt-20">
          <h5 className='meter-bar-title'>FTSO Statistics</h5>
          <div style={{ height: 250 }}>
            <ResponsiveLine
              data={d2}
              axisBottom={{
                legend: true,
                legendPosition: 'end'
              }}
              axisTop={null}
              axisLeft={null}
              axisRight={null}
              yFormat={v => Formatter.number(v, 3)}
              margin={{ top: 30, right: 30, bottom: 20, left: 20 }}
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

        <div className="row mt-20">
          <h5 className='meter-bar-title'>Delegated WSGB</h5>
          <div style={{ height: 250 }}>
            <ResponsiveLine
              data={d1}
              axisBottom={{
                legend: true,
                legendPosition: 'end'
              }}
              axisTop={null}
              axisLeft={null}
              axisRight={null}
              yFormat={v => Formatter.number(v, 3)}
              margin={{ top: 30, right: 30, bottom: 20, left: 20 }}
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

        <div className="row mt-20">
          <h5 className='meter-bar-title'>SGB Delegators</h5>
          <div style={{ height: 250 }}>
            <ResponsiveLine
              data={d3}
              axisBottom={{
                legend: true,
                legendPosition: 'end'
              }}
              axisTop={null}
              axisLeft={null}
              axisRight={null}
              yFormat={v => Formatter.number(v, 3)}
              margin={{ top: 30, right: 30, bottom: 20, left: 20 }}
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