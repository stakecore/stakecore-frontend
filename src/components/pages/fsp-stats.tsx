import { useCallback } from "react"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts"
import { Formatter } from "~/utils/misc/formatter"
import MeterBar from "~/components/ui/meterBar"
import EpochProgress from "~/components/ui/epochProgress"
import { Chain } from "~/enums"
import { chainToSymbol } from "~/utils/misc/translations"
import { FspEpoch, FTSO_CHAIN_CONFIG } from "~/utils/misc/flare"
import type { FspStatisticsDto } from "~/backendApi"


const chartMargin = { top: 20, right: 20, bottom: 5, left: 20 }

const StatsChart = ({ data, keys, formatY, height = 200 }: {
  data: Record<string, number>[],
  keys: string[],
  formatY: (v: number) => string,
  height?: number
}) => (
  <ResponsiveContainer width="100%" height={height}>
    <LineChart data={data} margin={chartMargin}>
      <XAxis dataKey="x" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} tickLine={false} axisLine={false} />
      <YAxis hide domain={['auto', 'auto']} />
      <Tooltip
        contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
        labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
        itemStyle={{ color: 'white' }}
        formatter={(v: number) => formatY(v)}
      />
      {keys.map((key, i) => (
        <Line
          key={key}
          type="monotone"
          dataKey={key}
          stroke={i === 0 ? 'white' : 'rgba(255,255,255,0.5)'}
          strokeWidth={2}
          dot={{ fill: 'black', stroke: i === 0 ? 'white' : 'rgba(255,255,255,0.5)', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6 }}
          name={key}
        />
      ))}
    </LineChart>
  </ResponsiveContainer>
)

const FspStatsComponent = ({ stats, chain }: { stats: FspStatisticsDto, chain: Chain }) => {
  const symbol = chainToSymbol(chain)
  const lastDelegationEpoch = Math.max(...stats.delegations.result.map(x => x.rewardEpoch))

  const cfg = FTSO_CHAIN_CONFIG[chain as keyof typeof FTSO_CHAIN_CONFIG]

  const epochPeriod = useCallback((now: number) => {
    const round = FspEpoch.timestampToRound(chain, now)
    const epoch = FspEpoch.roundToRewardEpoch(chain, round)
    const epochStart = epoch * cfg.rewardEpochDurationRounds
    return {
      startMs: FspEpoch.roundToTimestamp(chain, epochStart),
      endMs: FspEpoch.roundToTimestamp(chain, epochStart + cfg.rewardEpochDurationRounds),
      metadata: [
        { label: "Reward Epoch", value: epoch },
        { label: "Round", value: `${round - epochStart} / ${cfg.rewardEpochDurationRounds}` },
      ],
    }
  }, [chain, cfg])

  const roundPeriod = useCallback((now: number) => {
    const round = FspEpoch.timestampToRound(chain, now)
    const startMs = FspEpoch.roundToTimestamp(chain, round)
    return {
      startMs,
      endMs: startMs + cfg.roundDurationMs,
      metadata: [{ label: "Current Round", value: round }],
    }
  }, [chain, cfg])

  const d1 = stats.submissions.result.map(({ rewardEpoch, primary, secondary }) => ({
    x: rewardEpoch, 'Primary Success Rate': primary, 'Secondary Success Rate': secondary
  }))

  const d2 = stats.delegations.result.map(({ rewardEpoch, delegated }) => ({
    x: rewardEpoch, [`${symbol} Delegated`]: delegated
  }))

  const d4 = stats.apys.result.map(({ rewardEpoch, apy }) => ({
    x: rewardEpoch, 'APY': apy
  }))

  const last = stats.submissions.result[stats.submissions.result.length - 1]

  const component = <>
    <div className='single-project-page-right wow fadeInUp delay-0-4s mt-30'>
      <div className="row mb-30">
        <div className="col-lg-6">
          <EpochProgress period={epochPeriod} color="FireBrick" />
        </div>
        <div className="col-lg-6">
          <EpochProgress period={roundPeriod} color="#76B768" />
        </div>
      </div>
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
        <StatsChart data={d1} keys={['Primary Success Rate', 'Secondary Success Rate']} formatY={v => Formatter.percent(v)} height={250} />
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
        <StatsChart data={d2} keys={[`${symbol} Delegated`]} formatY={v => Formatter.number(v)} />
      </div>

      <div className="row mt-40">
        <h5 className='meter-bar-title'>APY through reward epochs</h5>
        <p>
          Annual percentage yield (APY) earned by delegators for each <i>reward epoch</i>, based on the
          provider's performance and delegation weight during the vote power block.
          Note that due to protocol's reward capping, high delegation volume can result in lower APY.
        </p>
        <StatsChart data={d4} keys={['APY']} formatY={v => Formatter.percent(v)} />
      </div>

    </div>
  </>


  return component
}

export default FspStatsComponent
