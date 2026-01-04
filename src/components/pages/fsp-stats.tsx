import { ResponsiveLine } from "@nivo/line"
import { Formatter } from "~/utils/misc/formatter"
import MeterBar from "~/components/ui/meterBar"
import { Chain } from "~/enums"
import { chainToSymbol } from "~/utils/misc/translations"
import type { FspStatisticsDto } from "~/backendApi"


const FspStatsComponent = ({ stats, chain }: { stats: FspStatisticsDto, chain: Chain }) => {
  const symbol = chainToSymbol(chain)
  const lastDelegationEpoch = Math.max(...stats.delegations.result.map(x => x.rewardEpoch))

  const d1 = [
    {
      id: 'Primary Success Rate',
      data: stats.submissions.result.map(({ rewardEpoch: x, primary: y }) => ({ x, y }))
    },
    {
      id: 'Secondary Success Rate',
      data: stats.submissions.result.map(({ rewardEpoch: x, secondary: y }) => ({ x, y }))
    }
  ]

  const d2 = [
    {
      id: `${symbol} Delegated`,
      data: stats.delegations.result.map(({ rewardEpoch: x, delegated: y }) => ({ x, y }))
    }
  ]

  const d3 = [
    {
      id: `${symbol} Delegators`,
      data: stats.delegations.result.map(({ rewardEpoch: x, delegators: y }) => ({ x, y }))
    }
  ]

  const last = stats.submissions.result[stats.submissions.result.length - 1]

  const component = <>
    <div className='single-project-page-right wow fadeInUp delay-0-4s mt-30'>
      <h2>Provider Statistics</h2>
      <p>
        We value transparency, and stream a part of our monitoring to this site,
        so you can see live data of our provider's performance for the current <i>reward epoch</i> {last.rewardEpoch}.
        We also display the historical data for some relevant metrics over the past 25 reward epochs (90 days),
        and provide a deeper understanding of the protocol.
      </p>
      <div className="row">
        <div className="col-lg-6">
          <MeterBar name='Primary Success' ranges={[20, 50]} value={last.primary} text={Formatter.percent(last.primary, 1)} />
          <MeterBar name='Secondary Success' ranges={[75, 90]} value={last.secondary} text={Formatter.percent(last.secondary, 1)} />
        </div>
        <div className="col-lg-6">
          <MeterBar name='Minimal Success' ranges={[95, 98]} value={last.minimal} text={Formatter.percent(last.minimal, 1)} />
          <MeterBar name='Uptime' ranges={[85, 95]} value={last.uptime} text={Formatter.percent(last.uptime, 1)} />
        </div>
      </div>
      <div className="row mt-50">
        <h5 className='meter-bar-title'>FTSO primary and secondary success rates</h5>
        <p>
          Prices on Flare are submitted in 90 second epochs called rounds. Each round, all FSP providers
          are required to submit a price for each of the ~60 crypto tickers. When the submitted price
          falls between the 1st and 3rd stake-weighted quartile of all submissions, it is considered a primary success for the submitting provider.
          When the submitted price falls within the percentage band (defined separately for each ticker) of the accepted median, it is considered a secondary
          success. Each <i>reward epoch</i> is a sequence of 3360 rounds (3.5 days), after which each provider's results are evaluated and the provider,
          along with its delegators, rewarded accordingly.
        </p>
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
            yFormat={v => Formatter.number(100 * v)}
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
        <h5 className='meter-bar-title'>Total delegated weight</h5>
        <p>
          At the end of each <i>reward epoch</i>, delegated W{symbol} of each provider is evaluated according
          to the state from a randomly selected <i>vote power block</i> within that epoch. That delegation amount is then
          used as the provider's weight for the next epoch, and serves as the APY basis.
          In the graphs below we also append the current state of our delegations as an approximation
          for the provider's weight in the following epoch {lastDelegationEpoch}.
        </p>
        <div style={{ height: 200 }}>
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
        <h5 className='meter-bar-title'>Total weight delegators</h5>
        <p>
          Total W{symbol} delegators, evaluated at each epoch's <i>vote power block</i>.
        </p>
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


  return component
}

export default FspStatsComponent