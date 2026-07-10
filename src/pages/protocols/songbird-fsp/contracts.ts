import { createFspContracts } from "../fsp/contracts"
import * as C from "~/constants"

// Thin per-chain binding of the shared FSP contract flow for the Songbird SSP.
export const { delegate, deposit, withdraw, claim } = createFspContracts({
  wrappedAdr: C.wrappedSgbAdr,
  wrappedAbi: C.wrappedSgbAbi,
  rewardManagerAdr: C.songbirdFspRewardManagerAdr,
  rewardManagerAbi: C.songbirdFspRewardManagerAbi,
  delegationAdr: C.songbirdDelegationAdr,
})
