import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { SpinnerCircular } from 'spinners-react'
import type { FspDelegatorInfoDto } from '~/backendApi'
import { Formatter } from '~/utils/misc/formatter'
import { actionStatusMessage } from '~/pages/protocols/utils'
import { MAX_BIPS, PAGE_COLOR_CODE } from '~/constants'
import { StatusCode, Status } from '~/enums'
import './fspLocalDelegate.scss'


// Adapter signatures match contractCallAdapter results — protocol-specific
// wrappers (flare-fsp / songbird-fsp delegateLocal.tsx) supply these by
// composing the raw contract functions with contractCallAdapter and the
// correct decimals.
export type FspLocalDelegateActions = {
  // Wrap native into wrapped (amount in token decimal value).
  deposit: (address: string, amount: number) => Promise<Status>
  // Unwrap wrapped back to native.
  withdraw: (address: string, amount: number) => Promise<Status>
  // Set the delegation percentage on the wrapped balance, in bips (0..10000).
  delegate: (address: string, bips: number) => Promise<Status>
  // Claim rewards for a specific reward epoch.
  claim: (address: string, epoch: number) => Promise<Status>
}

export type FspLocalDelegateProps = {
  data: FspDelegatorInfoDto
  walletAddress: string
  symbol: string         // FLR / SGB
  wrappedSymbol: string  // WFLR / WSGB
  delegationLabel: string  // displayed in success toasts, e.g. "Stakecore"
  actions: FspLocalDelegateActions
  onRefresh: () => void
}

// Each user action is its own single-transaction phase. Mutually exclusive
// so a second click can't race a pending tx.
type Phase =
  | { kind: 'idle' }
  | { kind: 'delegating' }
  | { kind: 'wrapping' }
  | { kind: 'unwrapping' }
  | { kind: 'claiming', epoch: number }

const FspLocalDelegate = ({
  data,
  walletAddress,
  symbol,
  wrappedSymbol,
  delegationLabel,
  actions,
  onRefresh,
}: FspLocalDelegateProps) => {

  const flrBalance = data.nat.balance
  const wflrBalance = data.wnat.balance
  const delegated = data.delegated
  const currentBips = wflrBalance > 0
    ? Math.round((delegated / wflrBalance) * MAX_BIPS)
    : 0
  const currentPct = currentBips / 100
  const pendingRewards = data.rewards.reduce((x, y) => x + y.amount, 0)
  const claimableEpochs = data.rewards
    .filter(r => r.amount > 0)
    .map(r => r.rewardEpoch)
    .sort((a, b) => a - b)

  // Inputs: percentage (0..100), wrap amount, unwrap amount.
  const [pctInput, setPctInput] = useState<string>(currentPct.toFixed(2))
  const [wrapInput, setWrapInput] = useState<string>('')
  const [unwrapInput, setUnwrapInput] = useState<string>('')
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })

  // Re-sync the percentage input whenever the on-chain delegation changes.
  useEffect(() => {
    setPctInput(currentPct.toFixed(2))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delegated, wflrBalance])

  const busy = phase.kind !== 'idle'

  const pctValue = Number(pctInput)
  const pctValid = !isNaN(pctValue) && pctValue >= 0 && pctValue <= 100
  const pctBips = pctValid ? Math.min(MAX_BIPS, Math.round(pctValue * 100)) : 0
  const pctChanged = pctValid && Math.abs(pctBips - currentBips) > 0

  const wrapValue = Number(wrapInput)
  const wrapValid = !isNaN(wrapValue) && wrapValue > 0 && wrapValue <= flrBalance

  const unwrapValue = Number(unwrapInput)
  const unwrapValid = !isNaN(unwrapValue) && unwrapValue > 0 && unwrapValue <= wflrBalance

  // --- Action handlers ---

  async function onSetDelegation() {
    if (!pctValid || !pctChanged || busy) return
    setPhase({ kind: 'delegating' })
    const toastId = toast.loading(`Setting delegation to ${pctValue.toFixed(2)}%…`)
    const status = await actions.delegate(walletAddress, pctBips)
    const ok = status === StatusCode.CONTRACT_CALL_EXECUTED
    toast.update(toastId, {
      type: ok ? 'success' : 'error',
      render: actionStatusMessage(
        status,
        `Delegation set to ${pctValue.toFixed(2)}% to ${delegationLabel}`,
      ),
      isLoading: false,
      autoClose: 3500,
    })
    setPhase({ kind: 'idle' })
    if (ok) onRefresh()
  }

  async function onWrap() {
    if (!wrapValid || busy) return
    setPhase({ kind: 'wrapping' })
    const toastId = toast.loading(`Wrapping ${wrapValue} ${symbol} → ${wrappedSymbol}…`)
    const status = await actions.deposit(walletAddress, wrapValue)
    const ok = status === StatusCode.CONTRACT_CALL_EXECUTED
    toast.update(toastId, {
      type: ok ? 'success' : 'error',
      render: actionStatusMessage(
        status,
        `Wrapped ${wrapValue} ${symbol} into ${wrappedSymbol}`,
      ),
      isLoading: false,
      autoClose: 3500,
    })
    setPhase({ kind: 'idle' })
    if (ok) {
      setWrapInput('')
      onRefresh()
    }
  }

  async function onUnwrap() {
    if (!unwrapValid || busy) return
    setPhase({ kind: 'unwrapping' })
    const toastId = toast.loading(`Unwrapping ${unwrapValue} ${wrappedSymbol} → ${symbol}…`)
    const status = await actions.withdraw(walletAddress, unwrapValue)
    const ok = status === StatusCode.CONTRACT_CALL_EXECUTED
    toast.update(toastId, {
      type: ok ? 'success' : 'error',
      render: actionStatusMessage(
        status,
        `Unwrapped ${unwrapValue} ${wrappedSymbol} to ${symbol}`,
      ),
      isLoading: false,
      autoClose: 3500,
    })
    setPhase({ kind: 'idle' })
    if (ok) {
      setUnwrapInput('')
      onRefresh()
    }
  }

  async function onClaim() {
    if (busy || claimableEpochs.length === 0) return
    for (const epoch of claimableEpochs) {
      setPhase({ kind: 'claiming', epoch })
      const toastId = toast.loading(`Claiming rewards (epoch ${epoch})…`)
      const status = await actions.claim(walletAddress, epoch)
      const ok = status === StatusCode.CONTRACT_CALL_EXECUTED
      toast.update(toastId, {
        type: ok ? 'success' : 'error',
        render: actionStatusMessage(
          status,
          `Claimed rewards for epoch ${epoch}`,
        ),
        isLoading: false,
        autoClose: 3500,
      })
      if (!ok) break
    }
    setPhase({ kind: 'idle' })
    onRefresh()
  }

  // --- Derived display values ---

  const flrFmt = Formatter.number(flrBalance)
  const wflrFmt = Formatter.number(wflrBalance)
  const delegatedFmt = Formatter.number(delegated)
  const rewardsFmt = Formatter.number(pendingRewards)
  const projectedDelegated = pctValid ? (pctBips / MAX_BIPS) * wflrBalance : 0

  return <div className="fsp-delegate">

    {/* Position summary — read-only state. No inline actions. */}
    <section className="fsp-delegate-position">
      <h3 className="fsp-delegate-block-header">Your position</h3>
      <div className="fsp-delegate-position-rows">
        <SummaryRow label={`${symbol} balance`} value={flrFmt} suffix={symbol} />
        <SummaryRow label={`${wrappedSymbol} balance`} value={wflrFmt} suffix={wrappedSymbol} />
        <SummaryRow
          label="Delegated"
          value={delegatedFmt}
          suffix={`${wrappedSymbol} (${currentPct.toFixed(2)}%)`}
        />
        <SummaryRow
          label="Pending rewards"
          value={rewardsFmt}
          suffix={wrappedSymbol}
        />
      </div>
    </section>

    {/* Claim CTA — only when there's something to claim. Full-width so it
        feels like a "do this right now" call to action rather than a chip
        hiding inside a row. */}
    {pendingRewards > 0 && (
      <button
        className="theme-btn fsp-delegate-claim-cta"
        onClick={onClaim}
        disabled={busy}
      >
        {phase.kind === 'claiming'
          ? <><SpinnerCircular size={14} color={PAGE_COLOR_CODE} /> Claiming…</>
          : <>Claim {rewardsFmt} {wrappedSymbol} in rewards</>}
      </button>
    )}

    {/* Numbered flow: Wrap → Delegate. */}
    <section className="fsp-delegate-flow">
      <h3 className="fsp-delegate-block-header">How to delegate</h3>

      <div className="fsp-delegate-step">
        <div className="fsp-delegate-step-label">
          <span className="fsp-delegate-step-num">Step 1</span>
          <span className="fsp-delegate-step-title">Wrap {symbol}</span>
        </div>
        <p className="fsp-delegate-step-body">
          Convert {symbol} into {wrappedSymbol} (1:1). Only {wrappedSymbol} can be
          delegated and earns rewards. You can unwrap any time.
        </p>
        <div className="fsp-delegate-input-row">
          <input
            type="number"
            inputMode="decimal"
            placeholder="0"
            min="0"
            step="any"
            value={wrapInput}
            onChange={e => setWrapInput(e.target.value)}
            disabled={busy || flrBalance <= 0}
            className="fsp-delegate-input"
          />
          <span className="fsp-delegate-input-suffix">{symbol}</span>
          <button
            className="fsp-delegate-max"
            onClick={() => setWrapInput(flrBalance.toFixed(2))}
            disabled={busy || flrBalance <= 0}
          >
            Max ({flrFmt})
          </button>
          <button
            className="theme-btn fsp-delegate-step-cta"
            onClick={onWrap}
            disabled={!wrapValid || busy}
          >
            {phase.kind === 'wrapping'
              ? <><SpinnerCircular size={14} color={PAGE_COLOR_CODE} /> Wrapping…</>
              : 'Wrap'}
          </button>
        </div>
        {flrBalance <= 0 && (
          <p className="fsp-delegate-step-note">
            You don't have any {symbol} to wrap. Skip to Step 2 if you already
            hold {wrappedSymbol}.
          </p>
        )}
      </div>

      <div className="fsp-delegate-step">
        <div className="fsp-delegate-step-label">
          <span className="fsp-delegate-step-num">Step 2</span>
          <span className="fsp-delegate-step-title">Set delegation percentage</span>
        </div>
        <p className="fsp-delegate-step-body">
          Choose what percentage of your {wrappedSymbol} is delegated to {delegationLabel}.
          Applies to your current and future {wrappedSymbol} balance until you change it.
        </p>
        <div className="fsp-delegate-input-row">
          <input
            type="number"
            inputMode="decimal"
            placeholder="0"
            min="0"
            max="100"
            step="any"
            value={pctInput}
            onChange={e => setPctInput(e.target.value)}
            disabled={busy}
            className="fsp-delegate-input"
          />
          <span className="fsp-delegate-input-suffix">%</span>
          <button
            className="fsp-delegate-max"
            onClick={() => setPctInput('100')}
            disabled={busy}
          >
            Max
          </button>
          <button
            className="theme-btn fsp-delegate-step-cta"
            onClick={onSetDelegation}
            disabled={!pctValid || !pctChanged || busy}
          >
            {phase.kind === 'delegating'
              ? <><SpinnerCircular size={14} color={PAGE_COLOR_CODE} /> Updating…</>
              : 'Update'}
          </button>
        </div>
        <p className="fsp-delegate-step-note">
          {!pctValid && (
            <span className="fsp-delegate-preview-error">
              Enter a percentage between 0 and 100.
            </span>
          )}
          {pctValid && pctChanged && wflrBalance > 0 && (
            <>Effective delegation: {Formatter.number(projectedDelegated)} {wrappedSymbol}{' '}
            (was {delegatedFmt} {wrappedSymbol}).</>
          )}
          {pctValid && pctChanged && wflrBalance === 0 && pctValue > 0 && (
            <span className="fsp-delegate-preview-warn">
              You have no {wrappedSymbol} yet — complete Step 1 first.
            </span>
          )}
          {pctValid && !pctChanged && (
            <>Delegation is already at {currentPct.toFixed(2)}%.</>
          )}
        </p>
      </div>
    </section>

    {/* Unwrap — collapsed by default. */}
    {wflrBalance > 0 && (
      <details className="fsp-delegate-unwrap">
        <summary>Unwrap {wrappedSymbol} back to {symbol}</summary>
        <p className="fsp-delegate-step-note">
          Reduces your {wrappedSymbol} balance — and therefore your effective
          delegation amount proportionally. To stop delegating entirely, set
          Step 2 to 0% before unwrapping.
        </p>
        <div className="fsp-delegate-input-row">
          <input
            type="number"
            inputMode="decimal"
            placeholder="0"
            min="0"
            step="any"
            value={unwrapInput}
            onChange={e => setUnwrapInput(e.target.value)}
            disabled={busy}
            className="fsp-delegate-input"
          />
          <span className="fsp-delegate-input-suffix">{wrappedSymbol}</span>
          <button
            className="fsp-delegate-max"
            onClick={() => setUnwrapInput(wflrBalance.toFixed(2))}
            disabled={busy}
          >
            Max ({wflrFmt})
          </button>
          <button
            className="theme-btn fsp-delegate-step-cta"
            onClick={onUnwrap}
            disabled={!unwrapValid || busy}
          >
            {phase.kind === 'unwrapping'
              ? <><SpinnerCircular size={14} color={PAGE_COLOR_CODE} /> Unwrapping…</>
              : 'Unwrap'}
          </button>
        </div>
      </details>
    )}

  </div>
}

const SummaryRow = ({ label, value, suffix }: {
  label: string
  value: string
  suffix: string
}) => (
  <div className="fsp-delegate-summary-row">
    <span className="fsp-delegate-summary-label">{label}</span>
    <span className="fsp-delegate-summary-value">
      {value} <span className="fsp-delegate-summary-suffix">{suffix}</span>
    </span>
  </div>
)

export default FspLocalDelegate
