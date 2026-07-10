import { createFspContracts } from "../fsp/contracts"
import * as C from "~/constants"

// Thin per-chain binding of the shared FSP contract flow. Kept as its own
// module (not inlined) so delegateLocal can dynamically import it for the
// ethers chunk split, and so contracts.test.ts can exercise the Flare targets.
export const { delegate, deposit, withdraw, claim } = createFspContracts({
  wrappedAdr: C.wrappedFlrAdr,
  wrappedAbi: C.wrappedFlrAbi,
  rewardManagerAdr: C.flareFspRewardManagerAdr,
  rewardManagerAbi: C.flareFspRewardManagerAbi,
  delegationAdr: C.flareDelegationAdr,
})
