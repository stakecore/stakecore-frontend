import { Chain } from "~/enums"
import { AvalancheValidatorService } from "~/backendApi"
import { createValidatorDataAccess } from "../validator/data"

export const AvalancheValidatorDataAccess = createValidatorDataAccess(Chain.AVALANCHE, {
  getDelegatorInfo: (address, pchain) =>
    AvalancheValidatorService.avalancheValidatorControllerGetAvalancheDelegatorInfo(address, pchain),
  getValidatorPageInfo: () =>
    AvalancheValidatorService.avalancheValidatorControllerGetAvalancheValidatorPageInfo(),
})

export default AvalancheValidatorDataAccess
