import type { ComponentType } from 'react'
import useSWR from 'swr'
import { useSearchParams } from 'react-router-dom'
import { SpinnerCircular } from 'spinners-react'
import { Chain } from '~/enums'
import { CHAIN_CONFIG } from '~/config/chains'
import ServerError from '~/components/ui/serverError'
import EmptyState from '~/components/ui/emptyState'
import ProjectTitle from "../title"
import InfoComponent from "../info"
import UnavailabilityBanner from "../unavailabilityBanner"
import ValidatorPicker from "../validatorPicker"
import ValidatorStatistics from "./statistics"
import type { ValidatorData } from "./types"
import type { ValidatorDataAccess } from "./data"
import '../protocols.scss'


// Pick the validator selected via `?node=…`, else the featured one, else the
// first entry. Returns null when the list is empty so callers can
// short-circuit rendering.
function pickSelected<T extends { base: { validatorNodeId: string, featured: boolean } }>(
  list: T[],
  nodeId: string | null,
): T | null {
  if (list.length === 0) return null
  if (nodeId) {
    const match = list.find(d => d.base.validatorNodeId === nodeId)
    if (match) return match
  }
  return list.find(d => d.base.featured) ?? list[0]
}

export interface ValidatorPageProps {
  chain: Chain
  swrKey: string
  title: string
  suptitle: string
  dataAccess: Pick<ValidatorDataAccess, 'getPageData'>
  Description: ComponentType
  OfficialDelegate: ComponentType<{ validatorLink: ValidatorData['delegation']['validatorLink'] }>
  // Flare exposes an on-site P-chain signing flow; Avalanche doesn't.
  LocalDelegate?: ComponentType<{ selectedNodeId: string }>
}

// Shared validator page shell. The Flare and Avalanche routes differ only in
// their chain (→ accent colour via CHAIN_CONFIG), data source, page copy, and
// which delegate components they supply, so the whole loading/error/empty/
// render ladder + picker wiring lives here once.
const ValidatorPage = ({
  chain,
  swrKey,
  title,
  suptitle,
  dataAccess,
  Description,
  OfficialDelegate,
  LocalDelegate,
}: ValidatorPageProps) => {
  const accentColor = CHAIN_CONFIG[chain].color
  const { data, error, isLoading } = useSWR(swrKey, () => dataAccess.getPageData())
  const [params, setParams] = useSearchParams()
  const selected = data ? pickSelected(data, params.get('node')) : null

  let component = null
  if (isLoading) {
    component = <>
      <div style={{ textAlign: 'center' }} className="mt-30 mb-30" >
        <SpinnerCircular color={accentColor} size={100} />
      </div>
    </>
  } else if (error != null) {
    component = <ServerError error={error} />
  } else if (!selected) {
    // Request succeeded but returned no validators (e.g. every validator
    // expired or was removed) — an empty state, not a connection failure.
    component = <EmptyState
      title='No validators available'
      description='There are no validators to display right now. Please check back soon.'
    />
  } else {
    component = <>
      <InfoComponent specs={selected.specs} summary={selected.summary} />
      {LocalDelegate && <LocalDelegate selectedNodeId={selected.base.validatorNodeId} />}
      <OfficialDelegate validatorLink={selected.delegation.validatorLink} />
      <ValidatorStatistics config={selected.graphics} />
    </>
  }

  // Picker lives top-right of the page title — only rendered once data has
  // loaded and a selection exists. ValidatorPicker hides itself when
  // validators.length <= 1 so a single-entry response still looks like the
  // original (pre-multi-validator) page.
  const picker = data && selected ? (
    <ValidatorPicker
      validators={data.map(d => d.base)}
      selectedNodeId={selected.base.validatorNodeId}
      onSelect={id => setParams({ node: id })}
      accentColor={accentColor}
    />
  ) : null

  return <>
    <div className="single-project-page-design">
      <ProjectTitle
        title={title}
        suptitle={suptitle}
        rightSlot={picker}
      />
      <div className="container pt-30">
        <Description />
        {component}
      </div>
    </div>
    {selected && <UnavailabilityBanner summary={selected.summary} />}
  </>
}

export default ValidatorPage
