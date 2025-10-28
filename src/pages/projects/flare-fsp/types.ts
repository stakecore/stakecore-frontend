import type { FlareFspInfoDto } from "~/backendApi"
import type { ISummary, ISpecs } from "~/components/types"


export type FlareData = {
  base: FlareFspInfoDto
  summary: ISummary
  specs: ISpecs
}