import useSWR from "swr"
import { SpinnerCircular } from 'spinners-react'
import { useCookies } from 'react-cookie'
import { Eip1193Provider, recoverAddress, SigningKey, hashMessage } from 'ethers'
import { useGlobalStore } from "~/utils/store/global"
import { flarePChainAddressUrl, REFRESH_QUERY_FAST_MS } from "~/constants"
import ServerError from "~/components/ui/serverError"
import StakeFlow from "~/components/ui/stakeFlow"
import DelegatorList from "~/components/ui/delegations"
import { HashLink } from "~/components/utils/links"
import { IStakeFlow } from "~/components/types"
import { toast } from "react-toastify"
import { Formatter } from "~/utils/misc/formatter"
import { personalSign } from "~/utils/eip6963/eip1193"
import { publicKeyToPAddress } from "~/utils/misc/addresses"
import FlareValidatorDataAccess from "../data"
import * as C from '../layout'
import type { AvalancheDelegatorInfoDto } from "~/backendApi"


const TEST_SIGN_MSG = 'STAKECORE-TEST-MESSAGE'

function delegatorInfoToStakeFlow(position: AvalancheDelegatorInfoDto): IStakeFlow['data'] {
  const delegated = position.delegations.reduce((x, y) => x + y.delegated, 0)
  return [{
    address: position.cChain.address,
    balance: position.cChain.balance,
    price: position.cChain.price,
    conversions: [C.C_TO_P_FACTOR, C.P_TO_C_FACTOR],
    fixedInputValue: null
  }, {
    address: position.pChain.address,
    balance: position.pChain.balance,
    price: position.pChain.price,
    conversions: [C.C_TO_P_FACTOR, C.P_TO_C_FACTOR],
    fixedInputValue: null
  }, {
    address: position.pChain.address,
    balance: delegated,
    price: position.pChain.price,
    conversions: [null, null],
    fixedInputValue: 0
  }]
}

async function requestSignature(address: string, provider: Eip1193Provider) {
  const fadr = Formatter.address(address)
  const msg = `waiting for user ${fadr} to sign test message "${TEST_SIGN_MSG}" with their wallet`
  const id = toast.loading(msg)

  const sig = await personalSign(TEST_SIGN_MSG, address, provider)
  const ok1 = sig != null
  toast.update(id, {
    type: ok1 ? 'success' : 'error',
    render: ok1 ? 'verifying user provided signature' : 'failed to sign message',
    isLoading: ok1,
    autoClose: 3000
  })
  if (!ok1) return

  let pubk: string
  let recv: string
  try {
    const digest = hashMessage(TEST_SIGN_MSG)
    pubk = SigningKey.recoverPublicKey(digest, sig)
    recv = recoverAddress(digest, sig)
  } catch { }

  let ok2 = true
  let msg2 = 'signature successfully verified'
  if (recv == null) {
    msg2 = 'failed to verify signature'
    ok2 = false
  } else if (recv.toLowerCase() != address) {
    msg2 = 'signed with mismatched account'
    ok2 = false
  }

  toast.update(id, {
    type: ok2 ? 'success' : 'error',
    render: msg2,
    isLoading: false,
    autoClose: 3000
  })

  return pubk
}

const FlareValidatorLocalDelegateComponent = () => {
  const setWalletChoiceVisible = useGlobalStore(state => state.setWalletChoiceVisible)
  const walletChoiceVisible = useGlobalStore(state => state.walletChoiceVisible)
  const walletAddress = useGlobalStore(state => state.walletAddress)
  const wallet = useGlobalStore(state => state.walletProvider)

  const [cookies, setCookies] = useCookies()

  const pubk = cookies[walletAddress]
  const pchain = pubk != null ? publicKeyToPAddress('flare', pubk) : undefined

  const { data: resp, isLoading, error } = useSWR(
    ['flare-p-chain-address', walletAddress, pchain], ([_, cchain, pchain]) => {
      if (cchain == null || resp?.status == 404 && pchain == null) {
        throw new Error('not ready')
      }
      return FlareValidatorDataAccess.getDelegatorInfo(cchain, pchain)
    }, { refreshInterval: REFRESH_QUERY_FAST_MS })

  async function onRequestSignature() {
    if (walletChoiceVisible || walletAddress == null) return
    const pubk = await requestSignature(walletAddress, wallet.provider)
    if (pubk == null) return
    setCookies(walletAddress, pubk)
  }

  async function onConnectWallet() {
    if (walletChoiceVisible || walletAddress != null) return
    setWalletChoiceVisible(true)
  }

  let component = null
  if (walletAddress == null) {
    component = <a onClick={onConnectWallet} className="theme-btn">
      Connect Wallet To See Your Position
    </a>
  } else if (isLoading && resp?.data == null && resp?.status != 404) {
    component = <div style={{ textAlign: 'center' }}>
      <SpinnerCircular color="firebrick" size={45} />
    </div>
  } else if (resp?.status == 404 && pubk == null && walletAddress != null) {
    component = <div>
      <div>
        <p>
          We could not locate the P-chain address of your C-chain address {Formatter.address(walletAddress, 5)}.
          This means you never interacted with the P-chain on Flare.
          If you want to see your account data please use your wallet to sign a test message so
          we can extract the public key from the signature and derive its P-chain address.
          Note that your public key will be stored as a cookie but never leave the browser.
        </p>
        <div className="notification-block danger mt-10 mb-20">
          Our test message is <b>{TEST_SIGN_MSG}</b>, never sign anything else!
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <a onClick={onRequestSignature} className="theme-btn">
          Sign A Test Message
        </a>
      </div>
    </div>
  } else if (resp?.data == null) {
    component = <ServerError status={500} message={error} />
  } else if (resp?.data != null) {
    component = <>
      <div>
        <div className="flare-stake-flow-container mt-40">
          <div style={{ textAlign: 'center' }}>
            <HashLink address={pchain} url={flarePChainAddressUrl(resp.data.pChain.address)} />
          </div>
          <StakeFlow layout={C.DELEGATE_FLOW_LAYOUT} data={delegatorInfoToStakeFlow(resp.data)} />
        </div>
        <div className="flare-delegator-list-container mt-40">
          <p>
            Below are active delegations from your account.
          </p>
          <DelegatorList delegators={resp.data.delegations} />
        </div>
      </div>
    </>
  }

  return (
    <div className="single-project-page-right wow fadeInUp delay-0-4s flare-div-border mt-30">
      <h2>How To Delegate</h2>
      <p>
        Delegating FLR involves moving it from C-Chain to P-Chain, where you then sign the add delegator transaction.
        After the set delegation lockup time expires, funds are automatically returned to your P-Chain account.
      </p>
      {component}
    </div>
  )
}

export default FlareValidatorLocalDelegateComponent