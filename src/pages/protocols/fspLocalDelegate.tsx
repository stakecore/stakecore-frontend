import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { SpinnerCircular } from 'spinners-react'
import type { FspDelegatorInfoDto } from '~/backendApi'
import { Formatter } from '~/utils/misc/formatter'
import { actionStatusMessage } from '~/pages/protocols/utils'
import { MAX_BIPS, PAGE_COLOR_CODE } from '~/constants'
import { StatusCode } from '~/enums'
import type { ContractCallResult } from '~/pages/protocols/utils'
import './fspLocalDelegate.scss'


// Adapter signatures match contractCallAdapter results — protocol-specific
// wrappers (flare-fsp / songbird-fsp delegateLocal.tsx) supply these by
// composing the raw contract functions with contractCallAdapter and the
// correct decimals.
export type FspLocalDelegateActions = {
  // Wrap native into wrapped (amount in token decimal value).
  deposit: (address: string, amount: number) => Promise<ContractCallResult>
  // Unwrap wrapped back to native.
  withdraw: (address: string, amount: number) => Promise<ContractCallResult>
  // Set the delegation percentage on the wrapped balance, in bips (0..10000).
  delegate: (address: string, bips: number) => Promise<ContractCallResult>
  // Claim rewards for a specific reward epoch.
  claim: (address: string, epoch: number) => Promise<ContractCallResult>
}

export type FspLocalDelegateProps = {
  data: FspDelegatorInfoDto
  walletAddress: string
  symbol: string         // FLR / SGB
  wrappedSymbol: string  // WFLR / WSGB
  delegationLabel: string  // displayed in success toasts, e.g. "Stakecore"
  actions: FspLocalDelegateActions
  // Builds an explorer URL for a given tx hash on the relevant chain.
  // Used in success toasts so users can verify the tx landed on-chain.
  explorerTxUrl: (hash: string) => string
  onRefresh: () => void
}

type ActionKey = 'wrap' | 'delegate' | 'unwrap' | 'claim'

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
  explorerTxUrl,
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

  // Per-action input state. Persists across card switches so the user
  // doesn't lose what they typed when they flip between actions.
  const [pctInput, setPctInput] = useState<string>(currentPct.toFixed(2))
  const [wrapInput, setWrapInput] = useState<string>('')
  const [unwrapInput, setUnwrapInput] = useState<string>('')
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })

  // Default selection picks the most relevant action for the current state.
  const initialAction: ActionKey = pendingRewards > 0
    ? 'claim'
    : flrBalance > 0 && delegated === 0
      ? 'wrap'
      : 'delegate'
  const [active, setActive] = useState<ActionKey>(initialAction)

  // Resync the percentage input with on-chain state after a refresh.
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

  // Tiny helper — append a clickable "view tx" link to the success
  // message when the contract call returned a hash. On error the hash
  // is undefined and the message renders as plain text.
  const renderToast = (message: string, hash?: string) =>
    hash
      ? <>{message} · <a href={explorerTxUrl(hash)} target="_blank" rel="noreferrer">view tx ↗</a></>
      : message

  async function onSetDelegation() {
    if (!pctValid || !pctChanged || busy) return
    setPhase({ kind: 'delegating' })
    const toastId = toast.loading(`Setting delegation to ${pctValue.toFixed(2)}%…`)
    const { status, hash } = await actions.delegate(walletAddress, pctBips)
    const ok = status === StatusCode.CONTRACT_CALL_EXECUTED
    toast.update(toastId, {
      type: ok ? 'success' : 'error',
      render: renderToast(
        actionStatusMessage(status, `Delegation set to ${pctValue.toFixed(2)}% to ${delegationLabel}`),
        hash,
      ),
      isLoading: false,
      autoClose: 5000,
    })
    setPhase({ kind: 'idle' })
    if (ok) onRefresh()
  }

  async function onWrap() {
    if (!wrapValid || busy) return
    setPhase({ kind: 'wrapping' })
    const toastId = toast.loading(`Wrapping ${wrapValue} ${symbol} → ${wrappedSymbol}…`)
    const { status, hash } = await actions.deposit(walletAddress, wrapValue)
    const ok = status === StatusCode.CONTRACT_CALL_EXECUTED
    toast.update(toastId, {
      type: ok ? 'success' : 'error',
      render: renderToast(
        actionStatusMessage(status, `Wrapped ${wrapValue} ${symbol} into ${wrappedSymbol}`),
        hash,
      ),
      isLoading: false,
      autoClose: 5000,
    })
    setPhase({ kind: 'idle' })
    if (ok) { setWrapInput(''); onRefresh() }
  }

  async function onUnwrap() {
    if (!unwrapValid || busy) return
    setPhase({ kind: 'unwrapping' })
    const toastId = toast.loading(`Unwrapping ${unwrapValue} ${wrappedSymbol} → ${symbol}…`)
    const { status, hash } = await actions.withdraw(walletAddress, unwrapValue)
    const ok = status === StatusCode.CONTRACT_CALL_EXECUTED
    toast.update(toastId, {
      type: ok ? 'success' : 'error',
      render: renderToast(
        actionStatusMessage(status, `Unwrapped ${unwrapValue} ${wrappedSymbol} to ${symbol}`),
        hash,
      ),
      isLoading: false,
      autoClose: 5000,
    })
    setPhase({ kind: 'idle' })
    if (ok) { setUnwrapInput(''); onRefresh() }
  }

  async function onClaim() {
    if (busy || claimableEpochs.length === 0) return
    // Flare's RewardManager.claim() settles every unclaimed epoch up
    // to and including the supplied rewardEpochId in one call, so a
    // single signature with the latest claimable epoch is enough —
    // no per-epoch loop / per-epoch signature needed.
    const latestEpoch = claimableEpochs[claimableEpochs.length - 1]
    setPhase({ kind: 'claiming', epoch: latestEpoch })
    const toastId = toast.loading(`Claiming rewards through epoch ${latestEpoch}…`)
    const { status, hash } = await actions.claim(walletAddress, latestEpoch)
    const ok = status === StatusCode.CONTRACT_CALL_EXECUTED
    toast.update(toastId, {
      type: ok ? 'success' : 'error',
      render: renderToast(
        actionStatusMessage(status, `Claimed rewards through epoch ${latestEpoch}`),
        hash,
      ),
      isLoading: false,
      autoClose: 5000,
    })
    setPhase({ kind: 'idle' })
    if (ok) onRefresh()
  }

  // --- Display helpers ---

  const flrFmt = Formatter.number(flrBalance)
  const wflrFmt = Formatter.number(wflrBalance)
  const rewardsFmt = Formatter.number(pendingRewards)
  const delegatedFmt = Formatter.number(delegated)
  const projectedDelegated = pctValid ? (pctBips / MAX_BIPS) * wflrBalance : 0

  return <div className="fsp-delegate">

    {/* Action card grid — visually matches the protocols-tile pattern. */}
    <div className="fsp-action-cards">
      <ActionCard
        step="01"
        label="Wrap"
        sub={flrBalance > 0 ? `${flrFmt} ${symbol} available` : `No ${symbol} to wrap`}
        active={active === 'wrap'}
        onClick={() => setActive('wrap')}
      />
      <ActionCard
        step="02"
        label="Delegate"
        sub={`Currently ${currentPct.toFixed(2)}%`}
        active={active === 'delegate'}
        onClick={() => setActive('delegate')}
      />
      <ActionCard
        step="03"
        label="Unwrap"
        sub={wflrBalance > 0 ? `${wflrFmt} ${wrappedSymbol} wrapped` : `No ${wrappedSymbol} to unwrap`}
        active={active === 'unwrap'}
        onClick={() => setActive('unwrap')}
      />
      <ActionCard
        step="04"
        label="Claim"
        sub={pendingRewards > 0 ? `${rewardsFmt} ${wrappedSymbol} pending` : 'No rewards yet'}
        active={active === 'claim'}
        onClick={() => setActive('claim')}
      />
    </div>

    {/* Selected action's panel */}
    <div className="fsp-action-panel">
      {active === 'wrap' && (
        <ActionPanel
          title={`Wrap ${symbol} into ${wrappedSymbol}`}
          body={<>Convert {symbol} into {wrappedSymbol} (1:1). Only {wrappedSymbol} earns rewards. You can unwrap any time.</>}
        >
          <InputRow
            input={
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
            }
            suffix={symbol}
            onMax={() => setWrapInput(flrBalance.toFixed(2))}
            maxLabel="Max"
            disabled={busy || flrBalance <= 0}
            cta={
              <button
                className="theme-btn fsp-delegate-step-cta"
                onClick={onWrap}
                disabled={!wrapValid || busy}
              >
                {phase.kind === 'wrapping'
                  ? <><SpinnerCircular size={14} color={PAGE_COLOR_CODE} /> Wrapping…</>
                  : 'Wrap'}
              </button>
            }
          />
        </ActionPanel>
      )}

      {active === 'delegate' && (
        <ActionPanel
          title={`Set delegation percentage to ${delegationLabel}`}
          body={<>Choose what percentage of your {wrappedSymbol} balance is delegated. The percentage is stored on-chain and applies to current and future {wrappedSymbol} automatically.</>}
        >
          <InputRow
            input={
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
            }
            suffix="%"
            onMax={() => setPctInput('100')}
            maxLabel="Max"
            disabled={busy}
            cta={
              <button
                className="theme-btn fsp-delegate-step-cta"
                onClick={onSetDelegation}
                disabled={!pctValid || !pctChanged || busy}
              >
                {phase.kind === 'delegating'
                  ? <><SpinnerCircular size={14} color={PAGE_COLOR_CODE} /> Updating…</>
                  : 'Update'}
              </button>
            }
          />
          <p className="fsp-delegate-step-note">
            {!pctValid && (
              <span className="fsp-delegate-preview-error">
                Enter a percentage between 0 and 100.
              </span>
            )}
            {pctValid && pctChanged && wflrBalance > 0 && (
              <>Effective delegation: {Formatter.number(projectedDelegated)} {wrappedSymbol} (was {delegatedFmt} {wrappedSymbol}).</>
            )}
            {pctValid && pctChanged && wflrBalance === 0 && pctValue > 0 && (
              <span className="fsp-delegate-preview-warn">
                You have no {wrappedSymbol} to delegate — wrap {symbol} first.
              </span>
            )}
            {pctValid && !pctChanged && (
              <>Delegation is already at {currentPct.toFixed(2)}%.</>
            )}
          </p>
        </ActionPanel>
      )}

      {active === 'unwrap' && (
        <ActionPanel
          title={`Unwrap ${wrappedSymbol} back to ${symbol}`}
          body={<>Reduces your {wrappedSymbol} balance, which reduces your effective delegation amount proportionally. To stop delegating entirely, set delegation to 0% first.</>}
        >
          <InputRow
            input={
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                min="0"
                step="any"
                value={unwrapInput}
                onChange={e => setUnwrapInput(e.target.value)}
                disabled={busy || wflrBalance <= 0}
                className="fsp-delegate-input"
              />
            }
            suffix={wrappedSymbol}
            onMax={() => setUnwrapInput(wflrBalance.toFixed(2))}
            maxLabel="Max"
            disabled={busy || wflrBalance <= 0}
            cta={
              <button
                className="theme-btn fsp-delegate-step-cta"
                onClick={onUnwrap}
                disabled={!unwrapValid || busy}
              >
                {phase.kind === 'unwrapping'
                  ? <><SpinnerCircular size={14} color={PAGE_COLOR_CODE} /> Unwrapping…</>
                  : 'Unwrap'}
              </button>
            }
          />
        </ActionPanel>
      )}

      {active === 'claim' && (
        <ActionPanel
          title="Claim pending rewards"
          body={pendingRewards > 0
            ? <>Rewards across {claimableEpochs.length} reward {claimableEpochs.length === 1 ? 'epoch' : 'epochs'} totaling {rewardsFmt} {wrappedSymbol}. A single signature claims them all at once.</>
            : <>No rewards available to claim right now. Rewards become claimable at the end of each reward epoch your {wrappedSymbol} was delegated during.</>}
        >
          <button
            className="theme-btn fsp-action-panel-claim"
            onClick={onClaim}
            disabled={busy || pendingRewards === 0}
          >
            {phase.kind === 'claiming'
              ? <><SpinnerCircular size={14} color={PAGE_COLOR_CODE} /> Claiming through epoch {phase.epoch}…</>
              : pendingRewards > 0
                ? `Claim ${rewardsFmt} ${wrappedSymbol}`
                : 'Nothing to claim'}
          </button>
        </ActionPanel>
      )}
    </div>

  </div>
}

// --- Sub-components ---

const ActionCard = ({ step, label, sub, active, onClick }: {
  step: string
  label: string
  sub: string
  active: boolean
  onClick: () => void
}) => (
  <button
    type="button"
    className={`fsp-action-card${active ? ' active' : ''}`}
    onClick={onClick}
  >
    <span className="fsp-action-card-step">{step}</span>
    <span className="fsp-action-card-label">{label}</span>
    <span className="fsp-action-card-sub">{sub}</span>
  </button>
)

const ActionPanel = ({ title, body, children }: {
  title: string
  body: React.ReactNode
  children: React.ReactNode
}) => (
  <div className="fsp-action-panel-inner">
    <h3 className="fsp-action-panel-title">{title}</h3>
    <p className="fsp-action-panel-body">{body}</p>
    {children}
  </div>
)

const InputRow = ({ input, suffix, onMax, maxLabel, disabled, cta }: {
  input: React.ReactNode
  suffix: string
  onMax: () => void
  maxLabel: string
  disabled: boolean
  cta: React.ReactNode
}) => (
  <div className="fsp-delegate-input-row">
    {input}
    <span className="fsp-delegate-input-suffix">{suffix}</span>
    <button
      className="fsp-delegate-max"
      onClick={onMax}
      disabled={disabled}
    >
      {maxLabel}
    </button>
    {cta}
  </div>
)

export default FspLocalDelegate
