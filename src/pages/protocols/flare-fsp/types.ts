import type { FspInfoDto } from "~/backendApi"
import type { ISummary, ISpecs } from "~/components/types"


export type FspData = {
  base: FspInfoDto
  summary: ISummary
  specs: ISpecs
}