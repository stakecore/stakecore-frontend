import { RiArrowDownLine, RiArrowUpLine } from "@remixicon/react"

const InvestFlowSwap = ({ down }) => {
  return <>
    <span className="invest-flow-swap-arrow">
      {down ? <RiArrowDownLine /> : <RiArrowUpLine />}
    </span>
  </>
}

const InvestFlowBar = ({ symbol, tokenUrl, balance, balanceUsd }) => {
  return <>
    <div className='invest-flow-bar-container'>
      <div className="invest-flow-bar row">

        <div className="invest-flow-bar-left col">

          <div className="logo">
            <span className="img">
              <img height={30} width={30} src={tokenUrl}></img>
            </span>
            <span className="name">
              {symbol}
            </span>
          </div>

          <div className="balance">
            <span className="number sm">{balance} ({balanceUsd}$)</span>
          </div>

        </div>

        <div className="invest-flow-bar-right col">

          <div className="amount">
            <span className="number bg">
              <input id="" className="amount-input" type='number' height={'30px'} placeholder="0" />
            </span>
          </div>

          <div>
            <span>
              <button className="max-button">Max</button>
            </span>
          </div>

        </div>

      </div>
    </div>
  </>
}

const InvestFlow = () => {
  const balance = '100'
  const balanceUsd = '10.00'
  const symbol1 = 'AVAX (C)'
  const symbol2 = 'AVAX (P)'
  const symbol3 = 'STAKED'
  const tokenUrl = 'https://flare-systems-explorer.flare.rocks/_next/image?url=%2Fbackend-url%2Fmedia%2Fimages%2Ffeed%2FAVAX_logo.png&w=96&q=75'

  return <>
    <div className="invest-flow-container">
      <InvestFlowBar balance={balance} balanceUsd={balanceUsd} symbol={symbol1} tokenUrl={tokenUrl} />
      <InvestFlowBar balance={balance} balanceUsd={balanceUsd} symbol={symbol2} tokenUrl={tokenUrl} />
      <InvestFlowBar balance={balance} balanceUsd={balanceUsd} symbol={symbol3} tokenUrl={tokenUrl} />
      <div className="invest-flow-swap-container" style={{ top: '33%' }} >
        <InvestFlowSwap down={true} />
        <InvestFlowSwap down={false} />
      </div>
      <div className="invest-flow-swap-container" style={{ top: '66%' }}>
        <InvestFlowSwap down={true} />
      </div>
    </div>
  </>
}

export default InvestFlow