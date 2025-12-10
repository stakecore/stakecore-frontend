import { useState } from "react"
import classNames from "classnames"
import { RiArrowDownLine, RiArrowUpLine } from "@remixicon/react"
import { toast } from 'react-toastify'
import { sleep } from "~/utils/misc/time"
import { Formatter } from "~/utils/misc/formatter"
import type { IStakeFlow, IStakeFlowBarAction, IStakeFlowDataPart, IStakeFlowLayoutPart } from "../types"


type NumberOrEmptyString = number | ""

interface IStakeFlowBarArgs {
  layout: IStakeFlowLayoutPart
  state: {
    i: number
    values: [number, number | null]
    focused: [boolean, boolean | null]
    frozen: boolean
    onInputChange: (i: number, value: number) => void
    onInputFocus: (i: number) => void
    freeze: (set: boolean) => void
  }
  data?: [IStakeFlowDataPart, IStakeFlowDataPart | null]
}

interface IStakeFlowBarActionArgs {
  down: boolean
  data: IStakeFlowDataPart
  action: IStakeFlowBarAction
  active: boolean
  value: number
  freeze: (set: boolean) => void
}

function defaultToEmptyString(value: number | null): NumberOrEmptyString {
  return (value ?? 0) <= 0 ? '' : value
}

const StakeFlowAction = ({ down, active, action, data, value, freeze }: IStakeFlowBarActionArgs) => {
  if (action.active == false) return <></>

  const [loading, setLoading] = useState(false)
  const [ok, setOk] = useState(null)

  async function flashOk(ok: boolean) {
    setOk(ok)
    await sleep(3500)
    setOk(null)
  }

  async function execute() {
    if (!action.active || !active || value == 0) return
    const fad = Formatter.address(data.address)
    const msg = `began executing ${action.name} for user ${fad} with value ${value}`
    const id = toast.loading(msg)
    freeze(true)
    setLoading(true)
    const status = await action.method(data.address, data.balance, value)
    setLoading(false)
    freeze(false)
    const ok = action.ok(status)
    flashOk(ok)
    toast.update(id, {
      type: ok ? 'success' : 'error',
      render: action.message(status, data.address, data.balance, value),
      isLoading: false,
      autoClose: 3000
    })
  }

  const parentcls = classNames('invest-flow-swap-arrow', { 'disabled': !active || loading || ok != null })
  const loadercls = classNames('overlay', { loading, failure: ok === false, success: ok === true })

  return <>
    <div data-tooltip-id="tooltip" data-tooltip-content={action.name} className={parentcls} onClick={execute}>
      <div className={loadercls} ></div>
      {down ? <RiArrowDownLine /> : <RiArrowUpLine />}
    </div>
  </>
}

const StakeFlowBar = ({ layout, state, data }: IStakeFlowBarArgs) => {
  const [dcurr, dnext] = data
  const balance = Formatter.number(dcurr.balance)
  const uvalue = Formatter.number(dcurr.balance * dcurr.price)

  const civalue = dcurr.fixedInputValue ?? state.values[0] ?? 0
  const nivalue = dnext?.fixedInputValue ?? state.values[1] ?? 0

  return <>
    <div className='invest-flow-bar-container'>
      <div className="invest-flow-bar row">

        <div className="invest-flow-bar-left col">

          <div className="logo">
            {layout.logo &&
              <span className="img">
                <img src={layout.logo}></img>
              </span>
            }
            <span className="name">
              {layout.symbol}
            </span>
          </div>

          <div className="balance">
            <span className="number sm">
              {balance} (${uvalue})
            </span>
          </div>

        </div>

        <div className="invest-flow-bar-right col">

          <div className="first">
            <span className="amount-input number bg">
              <input
                id={`invest-bar-${state.i}`}
                className="amount-input"
                type='number'
                placeholder="0"
                height={30}
                value={defaultToEmptyString(civalue)}
                onFocus={() => state.focused[0] || state.onInputFocus(state.i)}
                onChange={(ev) => state.onInputChange(state.i, Number(ev.target.value))}
                disabled={state.frozen || dcurr.fixedInputValue != null}
              />
            </span>
          </div>

          <div className="second">
            {layout.maxButton &&
              <span className="max-button">
                <button
                  onClick={() => {
                    state.onInputFocus(state.i)
                    state.onInputChange(state.i, dcurr.balance)
                  }}
                >Max</button>
              </span>
            }
          </div>

        </div>
      </div>

      <div key={state.i} className="invest-flow-swap-container">
        {layout.actions.down.active && <StakeFlowAction
          action={layout.actions.down}
          data={dcurr}
          down={true}
          active={state.focused[0] && civalue != 0 && !state.frozen}
          value={civalue}
          freeze={state.freeze}
        />}
        {layout.actions.up.active && <StakeFlowAction
          action={layout.actions.up}
          data={dnext}
          down={false}
          active={(state.focused[1] || dnext.fixedInputValue != null) && nivalue != 0 && !state.frozen}
          value={nivalue}
          freeze={state.freeze}
        />}
      </div>
    </div>
  </>
}

const StakeFlow = ({ layout, data }: IStakeFlow) => {
  const n = layout.length

  const [frozen, freeze] = useState<boolean>(false)
  const focused = Array.from({ length: n }, () => useState<boolean>(false))
  const values = Array.from({ length: n }, (_, i) => useState<number>(data[i].fixedInputValue))

  function onInputChange(i: number, value: number) {
    if (frozen) return
    for (let j = 0; j < n; j++) {
      let _value: NumberOrEmptyString = ""
      if (j == i) {
        _value = value
      } else {
        const f = data[i].conversions[j]
        if (f == null) continue
        _value = f(value)
      }
      values[j][1](_value)
    }
  }

  function onInputFocus(i: number) {
    if (frozen) return
    for (let j = 0; j < n; j++) {
      values[j][1](data[j].fixedInputValue)
      focused[j][1](i == j)
    }
  }

  return <>
    <div className="invest-flow-container">
      {
        Array.from({ length: n }).map((_, i) => {
          return <StakeFlowBar key={i}
            state={{
              i,
              frozen,
              values: [values[i][0], values[i + 1]?.[0]],
              focused: [focused[i][0], focused[i + 1]?.[0]],
              onInputChange, onInputFocus, freeze
            }}
            layout={layout[i]}
            data={[data[i], data[i + 1]]}
          />
        })
      }
    </div>
  </>
}

export default StakeFlow