import { PageUserInfoDto, ApyDto, BalanceDto } from "~/backendApi"
import { Formatter } from "../misc/formatter"
import * as C from "../../constants"

function structureApyData(apys: ApyDto[]): Map<string, Map<string, number>> {
  const mp = new Map()
  for (const apy of apys) {
    if (mp.get(apy.chain) == null) {
      mp.set(apy.chain, new Map())
    }
    mp.get(apy.chain).set(apy.protocol, apy.apy)
  }
  return mp
}

function structureBalanceData(balances: BalanceDto[]): Map<string, number> {
  const mp = new Map()
  for (const balance of balances) {
    mp.set(balance.token, balance.amount)
  }
  return mp
}

function joinTokenValues(values: number[], svalues: string[], names: string[]): string {
  const s = values.map((v, i) => (v > 0) ? svalues[i] + ' ' + names[i] : '')
  return s.join(' and ')
}

export const getProposalData = (info: PageUserInfoDto) => {
  const apydata = structureApyData(info.apys)
  const baldata = structureBalanceData(info.balances)

  const totalFlr = baldata.get(C.FLR_SYMBOL)
  const totalWFlr = baldata.get(C.WFLR_SYMBOL)
  const totalSgb = baldata.get(C.SGB_SYMBOL)
  const totalWSgb = baldata.get(C.WSGB_SYMBOL)
  const totalAvax = baldata.get(C.AVAX_SYMBOL)

  const ret = []

  if (totalFlr > 0 || totalWFlr > 0) {
    const apyFsp = apydata.get('Flare').get('FSP')
    const apyVal = apydata.get('Flare').get('Validator')
    const earned = apyVal * (totalFlr + totalWFlr) * info.prices.flr

    const capital = joinTokenValues(
      [totalFlr, totalWFlr],
      [Formatter.number(totalFlr), Formatter.number(totalWFlr)],
      [C.FLR_SYMBOL, C.WFLR_SYMBOL]
    )

    ret.push({
      id: 1,
      title: "Flare Network",
      price: Formatter.number(earned),
      sortInfo: `Invest your ${capital} into our protocols to earn up to`,
      features: [
        {
          id: 1,
          feature: `Earn ${Formatter.percent(apyVal)} APY by delegating ${C.FLR_SYMBOL} to our validator`,
          link: '/flare/validator'
        },
        {
          id: 2,
          feature: `Earn ${Formatter.percent(apyFsp)} APY by delegating ${C.WFLR_SYMBOL} to our FSP provider`,
          link: '/flare/fsp'
        }
      ]
    })
  }

  if (totalAvax > 0) {
    const apyVal = apydata.get('Avalanche').get('Validator')
    const earned = totalAvax * apyVal * info.prices.avax

    const fTotalAvax = Formatter.number(totalAvax)

    ret.push({
      id: 2,
      title: "Avalanche",
      price: Formatter.number(earned),
      sortInfo: `Invest your ${fTotalAvax} ${C.AVAX_SYMBOL} into our protocols to earn up to`,
      features: [
        {
          id: 1,
          feature: `Earn ${Formatter.percent(apyVal)} APY by delegating ${C.AVAX_SYMBOL} to our validator`,
          link: '/avalanche/validator'
        }
      ]
    })
  }

  if (totalSgb > 0 || totalWSgb > 0) {
    const apyFsp = apydata.get('Songbird').get('FSP')
    const earned = (totalSgb + totalWSgb) * apyFsp * info.prices.sgb

    const capital = joinTokenValues(
      [totalSgb, totalWSgb],
      [Formatter.number(totalSgb), Formatter.number(totalWSgb)],
      [C.SGB_SYMBOL, C.WSGB_SYMBOL]
    )

    ret.push({
      id: 3,
      title: "Songbird Canary Network",
      price: Formatter.number(earned),
      sortInfo: `Invest your ${capital} into our protocols to earn up to`,
      features: [
        {
          id: 1,
          feature: `Earn ${Formatter.percent(apyFsp)} APY by delegating ${C.WSGB_SYMBOL} to our FSP provider`,
          link: '/songbird/fsp'
        }
      ]
    })
  }

  return ret
}