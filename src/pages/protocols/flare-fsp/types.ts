import type { FspInfoDto } from "~/backendApi"
import type { ISummary, ISpecs } from "../types"


export type FspData = {
  base: FspInfoDto
  summary: ISummary
  specs: ISpecs
}