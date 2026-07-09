import { Chain } from "~/enums"
import { FlareValidatorService } from "~/backendApi"
import { createValidatorDataAccess } from "../validator/data"

export const FlareValidatorDataAccess = createValidatorDataAccess(Chain.FLARE, {
  getDelegatorInfo: (address, pchain) =>
    FlareValidatorService.flareValidatorControllerGetFlareDelegatorInfo(address, pchain),
  getValidatorPageInfo: () =>
    FlareValidatorService.flareValidatorControllerGetFlareValidatorPageInfo(),
})

export default FlareValidatorDataAccess
