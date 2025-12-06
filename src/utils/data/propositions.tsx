import { PageUserInfoDto, ApyDto, BalanceDto } from "~/backendApi"
import { Formatter } from "../misc/formatter"

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

export const getPropositionData = (info: PageUserInfoDto) => {
  const apydata = structureApyData(info.apys)
  const baldata = structureBalanceData(info.balances)

  const totalFlr = baldata.get('FLR')
  const totalWFlr = baldata.get('WFLR')
  const totalSgb = baldata.get('SGB')
  const totalWSgb = baldata.get('WSGB')
  const totalAvax = baldata.get('AVAX')

  const ret = []

  if (totalFlr > 0 || totalWFlr > 0) {
    const apyFsp = apydata.get('Flare').get('FSP')
    const apyVal = apydata.get('Flare').get('Validator')
    const earned = apyVal * (totalFlr + totalWFlr) * info.prices.flr

    let str = ''
    if (totalFlr > 0) {
      const fTotalFlr = Formatter.number(totalFlr, 3)
      str += fTotalFlr + ' FLR'
    }

    if (totalWFlr > 0) {
      if (str.length > 0) {
        str += ' and '
      }
      const fTotalWFlr = Formatter.number(totalWFlr, 3)
      str += fTotalWFlr + ' WFLR'
    }

    ret.push({
      id: 1,
      title: "Flare Network",
      price: Formatter.number(earned, 3),
      sortInfo: `Invest your ${str} into our protocols to earn up to`,
      features: [
        {
          id: 1,
          feature: `Earn ${Formatter.percent(apyVal, 0)} APY by delegating FLR to our validator`,
          link: '/flare/validator'
        },
        {
          id: 2,
          feature: `Earn ${Formatter.percent(apyFsp, 0)} APY by delegating WFLR to our FSP provider`,
          link: '/flare/fsp'
        }
      ]
    })
  }

  if (totalAvax > 0) {
    const apyVal = apydata.get('Avalanche').get('Validator')
    const earned = totalAvax * apyVal * info.prices.avax

    const fTotalAvax = Formatter.number(totalAvax, 3)

    ret.push({
      id: 2,
      title: "Avalanche",
      price: Formatter.number(earned, 3),
      sortInfo: `Invest your ${fTotalAvax} AVAX into our protocols to earn up to`,
      features: [
        {
          id: 1,
          feature: `Earn ${Formatter.percent(apyVal, 0)} APY by delegating AVAX to our validator`,
          link: '/avalanche/validator'
        }
      ]
    })
  }

  if (totalSgb > 0 || totalWSgb > 0) {
    const apyFsp = apydata.get('Songbird').get('FSP')
    const earned = (totalSgb + totalWSgb) * apyFsp * info.prices.sgb

    const fTotalSgb = Formatter.number(totalSgb, 3)
    const fTotalWSgb = Formatter.number(totalWSgb, 3)

    ret.push({
      id: 3,
      title: "Songbird Canary Network",
      price: Formatter.number(earned, 3),
      sortInfo: `Invest your ${fTotalSgb} SGB and ${fTotalWSgb} WSGB into our protocols to earn up to`,
      features: [
        {
          id: 1,
          feature: `Earn ${Formatter.percent(apyFsp, 0)} APY by delegating WSGB to our FSP provider`,
          link: '/songbird/fsp'
        }
      ]
    })
  }

  return ret
}