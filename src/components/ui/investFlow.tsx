import { useState } from "react"
import { RiArrowDownLine, RiArrowUpLine } from "@remixicon/react"
import type { InvestFlowConfig } from "../types"


function defaultToEmptyString(x: number): number | "" {
  return x == 0 ? '' : x
}

interface InvestFlowBarArgs {
  token: {
    symbol: string
    logoUrl: string
    balance: number
    price: number
  }
  value: number | ""
  focused: boolean
  i: number
  onChange: (i: number, value: number) => void
  setFocus: (i: number) => void
}

const InvestFlowArrow = ({ down, active }) => {
  const cls = active ? '' : ' disabled'
  return <>
    <span className={"invest-flow-swap-arrow" + cls}>
      {down ? <RiArrowDownLine /> : <RiArrowUpLine />}
    </span>
  </>
}

const InvestFlowBar = (args: InvestFlowBarArgs) => {
  const r = args.token
  return <>
    <div className='invest-flow-bar-container'>
      <div className="invest-flow-bar row">

        <div className="invest-flow-bar-left col">

          <div className="logo">
            <span className="img">
              <img height={30} width={30} src={args.token.logoUrl}></img>
            </span>
            <span className="name">
              {args.token.symbol}
            </span>
          </div>

          <div className="balance">
            <span className="number sm">{r.balance} (${r.balance * r.price})</span>
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
                value={args.value}
                onFocus={() => args.focused ? null : args.setFocus(args.i)}
                onChange={(ev) => args.onChange(args.i, Number(ev.target.value))}
              />
            </span>
          </div>

          <div>
            <span className="max-button">
              <button
                onClick={() => args.onChange(args.i, r.balance)}
                disabled={!args.focused}
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

const InvestFlow = ({ tokens, staked }: InvestFlowConfig) => {
  const n = tokens.length

  const focused = Array.from({ length: n }, () => useState<boolean>(false))
  const values = Array.from({ length: n }, () => useState<number | "">(""))

  function onChange(i: number, value: number) {
    for (let j = 0; j < n; j++) {
      const r = tokens[i].ireturn[j]
      if (r == null) continue
      values[j][1](defaultToEmptyString(value * r))
    }
  }

  function onFocused(i: number) {
    for (let j = 0; j < n; j++) {
      values[j][1]("")
      focused[j][1](i == j)
    }
  }

  return <>
    <div className="invest-flow-container">
      {
        Array.from({ length: n }).map((_, i) => (
          <InvestFlowBar key={i} i={i} focused={focused[i][0]} value={values[i][0]} token={tokens[i]} setFocus={onFocused} onChange={onChange} />
        ))
      }
      <InvestFlowStakeBar staked={staked} price={tokens[n-1].price} />
      {
        Array.from({ length: n }).map((_, i) => {
          return (
            <div key={i} className="invest-flow-swap-container" style={{ top: `${100 * (i + 1) / (n + 1)}%` }}>
              {tokens[i].arrows.down && <InvestFlowArrow down={true} active={focused[i][0] && values[i][0] != ""} />}
              {tokens[i].arrows.up && <InvestFlowArrow down={false} active={focused[i+1][0] && values[i+1][0] != ""} />}
            </div>
          )
        })
      }
    </div>
  </>
}

export default InvestFlow