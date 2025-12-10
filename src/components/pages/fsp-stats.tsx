import { ResponsiveLine } from "@nivo/line"
import classNames from "classnames"
import { Formatter } from "~/utils/misc/formatter"
import MeterBar from "~/components/ui/meterBar"
import { Chain } from "~/enums"
import { chainToDivBorderClassName, chainToSymbol } from "~/utils/misc/translations"
import type { FspStatisticsDto } from "~/backendApi"


const FspStatsComponent = ({ stats, chain }: { stats: FspStatisticsDto, chain: Chain }) => {
  const symbol = chainToSymbol(chain)
  const classname = chainToDivBorderClassName(chain)

  const d1 = [
    {
      id: `${symbol} Delegated`,
      data: stats.delegations.result.map(({ rewardEpoch: x, delegated: y }) => ({ x, y }))
    }
  ]

  const d2 = [
    {
      id: 'Primary Success Rate',
      data: stats.submissions.result.map(({ rewardEpoch: x, primary: y }) => ({ x, y }))
    },
    {
      id: 'Secondary Success Rate',
      data: stats.submissions.result.map(({ rewardEpoch: x, secondary: y }) => ({ x, y }))
    }
  ]

  const d3 = [
    {
      id: `${symbol} Delegators`,
      data: stats.delegations.result.map(({ rewardEpoch: x, delegators: y }) => ({ x, y }))
    }
  ]

  const last = stats.submissions.result[stats.submissions.result.length - 1]
  const uptime = Formatter.percent(last.uptime, 1)
  const primary = Formatter.percent(last.primary, 1)
  const secondary = Formatter.percent(last.secondary, 1)

  const component = <>
    <div className={classNames('single-project-page-right wow fadeInUp delay-0-4s mt-30', { [classname]: true })}>
      <h2>Provider Statistics</h2>
      <p>
        We value transparency, and stream a part of our monitoring to this site,
        so you can see live data of the provider's performance for the current reward epoch {last.rewardEpoch}.
        Below we also display the historical data for some relevant metrics over the past 25 reward epochs (90 days).
      </p>
      <div className="row">
        <div className="col-lg-6">
          <MeterBar name='Primary Success' ranges={[20, 50]} value={last.primary} text={primary} />
          <MeterBar name='Secondary Success' ranges={[80, 95]} value={last.secondary} text={secondary} />
          <MeterBar name='Uptime' ranges={[95, 98]} value={last.uptime} text={uptime} />
        </div>
        <div className="col-lg-6">
          <MeterBar name='Primary Success' ranges={[20, 50]} value={last.primary} text={primary} />
          <MeterBar name='Secondary Success' ranges={[80, 95]} value={last.secondary} text={secondary} />
          <MeterBar name='Uptime' ranges={[95, 98]} value={last.uptime} text={uptime} />
        </div>
      </div>
      <div className="row mt-50">
        <h5 className='meter-bar-title'>FTSO</h5>
        <p>Primary and secondary success rates.</p>
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
            yFormat={v => Formatter.number(v)}
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

      <div className="row mt-40">
        <h5 className='meter-bar-title'>Delegated W{symbol}</h5>
        <p>Total W{symbol} delegation weight, evaluated at each epoch's vote power block.</p>
        <div style={{ height: 200 }}>
          <ResponsiveLine
            data={d1}
            axisBottom={{
              legend: true,
              legendPosition: 'end'
            }}
            axisTop={null}
            axisLeft={null}
            axisRight={null}
            yFormat={v => Formatter.number(v)}
            margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
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

      <div className="row mt-40">
        <h5 className='meter-bar-title'>W{symbol} Delegators</h5>
        <p>Total W{symbol} delegators, evaluated at each epoch's vote power block.</p>
        <div style={{ height: 200 }}>
          <ResponsiveLine
            data={d3}
            axisBottom={{
              legend: true,
              legendPosition: 'end'
            }}
            axisTop={null}
            axisLeft={null}
            axisRight={null}
            yFormat={v => Formatter.number(v)}
            margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
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


  return component
}

export default FspStatsComponent