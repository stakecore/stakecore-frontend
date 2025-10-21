import { useState } from "react"
import { SpinnerCircular } from "spinners-react"
import { RiArrowDownLine, RiArrowUpLine } from "@remixicon/react"
import classNames from "classnames"
import { AVALANCHE_COLOR_CODE } from "~/utlits/data/constants"
import type { IStakeFlow } from "../types"


function defaultToEmptyString(x: number): number | "" {
  return x <= 0 ? '' : x
}

interface IStakeFlowBarArgs {
  i: number
  token: {
    symbol: string
    logoUrl: string
    balance: number
    price: number
  }
  state: {
    value: number | ""
    focused: boolean
  }
  onInputChange: (i: number, value: number) => void
  onInputFocus: (i: number) => void
}

const InvestFlowArrow = ({ down, active, action, address, value }) => {
  const [loading, setLoading] = useState(false)

  async function onClick() {
    setLoading(true)
    const ok = await action(address, value)
    setLoading(false)
  }

  const cls = classNames('invest-flow-swap-arrow', { 'disabled': !active })

  if (loading) {
    return <>
      <div className={cls} style={{ padding: 6 }}>
        <SpinnerCircular size={30} color={AVALANCHE_COLOR_CODE} />
      </div>
    </>
  }

  return <>
    <div onClick={onClick} className={cls}
    >{down ? <RiArrowDownLine /> : <RiArrowUpLine />}
    </div>
  </>
}

const InvestFlowBar = (args: IStakeFlowBarArgs) => {
  const { token } = args
  return <>
    <div className='invest-flow-bar-container'>
      <div className="invest-flow-bar row">

        <div className="invest-flow-bar-left col">

          <div className="logo">
            <span className="img">
              <img src={args.token.logoUrl}></img>
            </span>
            <span className="name">
              {args.token.symbol}
            </span>
          </div>

          <div className="balance">
            <span className="number sm">{token.balance} (${token.balance * token.price})</span>
          </div>

        </div>

        <div className="invest-flow-bar-right col">

          <div className="amount">
            <span className="amount-input number bg">
              <input
                id={`invest-bar-${args.i}`}
                className="amount-input"
                type='number'
                placeholder="0"
                height={30}
                value={args.state.value}
                onFocus={() => args.state.focused ? null : args.onInputFocus(args.i)}
                onChange={(ev) => args.onInputChange(args.i, Number(ev.target.value))}
              />
            </span>
          </div>

          <div>
            <span className="max-button">
              <button
                onClick={() => args.onInputChange(args.i, token.balance)}
                disabled={!args.state.focused}
              >Max</button>
            </span>
          </div>

        </div>

      </div>
    </div>
  </>
}

const InvestFlowStakeBar = ({ staked, price }) => {
  return <>
    <div className='invest-flow-bar-container'>
      <div className="invest-flow-bar row">

        <div className="invest-flow-bar-left col">
          <div className="logo">
            <span style={{ fontSize: '20px', fontWeight: 'bold' }}>STAKED</span>
          </div>
          <div className="balance">
            <span className="number sm">{staked} (${staked * price})</span>
          </div>
        </div>

        <div className="invest-flow-bar-right col">
        </div>

      </div>
    </div>
  </>
}

const InvestFlow = ({ layout, data }: IStakeFlow) => {
  const n = layout.tokens.length

  const focused = Array.from({ length: n }, () => useState<boolean>(false))
  const values = Array.from({ length: n }, () => useState<number | "">(""))

  function onBarInputChange(i: number, value: number) {
    values[i][1](defaultToEmptyString(value))
    for (let j = 0; j < n; j++) {
      if (j == i) continue
      const f = data.tokens[i].stakeReturn[j]
      if (f == null) continue
      values[j][1](defaultToEmptyString(f(value)))
    }
  }

  function onBarInputFocus(i: number) {
    for (let j = 0; j < n; j++) {
      values[j][1]("")
      focused[j][1](i == j)
    }
  }

  return <>
    <div className="invest-flow-container">
      {
        Array.from({ length: n }).map((_, i) => {
          return <InvestFlowBar key={i}
            i={i}
            onInputFocus={onBarInputFocus}
            onInputChange={onBarInputChange}
            token={{
              symbol: layout.tokens[i].symbol,
              logoUrl: layout.tokens[i].logoUrl,
              balance: data.tokens[i].balance,
              price: data.tokens[i].price
            }}
            state={{
              focused: focused[i][0],
              value: values[i][0]
            }}
          />
        })
      }
      <InvestFlowStakeBar staked={data.staked} price={data.tokens[n - 1].price} />
      {
        Array.from({ length: n }).map((_, i) => {
          const action = layout.tokens[i].actions
          const offset = 100 * (i + 1) / (n + 1)
          return (
            <div key={i} className="invest-flow-swap-container" style={{ top: `${offset}%` }}>
              {action.down != null && <InvestFlowArrow
                action={action.down}
                down={true}
                active={focused[i][0] && values[i][0] != ""}
                address={data.tokens[i].address}
                value={values[i][0]}
              />}
              {action.up != null && <InvestFlowArrow
                action={action.up}
                down={false}
                active={focused[i + 1][0] && values[i + 1][0] != ""}
                address={data.tokens[i].address}
                value={values[i + 1][0]}
              />}
            </div>
          )
        })
      }
    </div>
  </>
}

export default InvestFlow