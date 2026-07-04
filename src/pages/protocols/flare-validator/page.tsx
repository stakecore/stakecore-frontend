import useSWR from 'swr'
import { useSearchParams } from 'react-router-dom'
import { SpinnerCircular } from 'spinners-react'
import ServerError from '~/components/ui/serverError'
import EmptyState from '~/components/ui/emptyState'
import ProjectTitle from "../title"
import ProjectDescription from './components/description'
import InfoComponent from "../info"
import UnavailabilityBanner from "../unavailabilityBanner"
import ValidatorPicker from "../validatorPicker"
import FlareValidatorStatisticsComponent from "./components/statistics"
import FlareValidatorOfficialDelegateComponent from "./components/delegateOfficial"
import FlareValidatorLocalDelegateComponent from "./components/delegateLocal"
import FlareValidatorDataAccess from "./data"
import { FLARE_COLOR_CODE } from '~/constants'
import '../protocols.scss'


// Pick the validator selected via `?node=…`, else the featured one,
// else the first entry. Returns null when the list is empty so callers
// can short-circuit rendering.
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

export const FlareValidatorPage = () => {
  const { data, error, isLoading } = useSWR('flare-validator-page',
    (_) => FlareValidatorDataAccess.getFlarePageData())
  const [params, setParams] = useSearchParams()
  const selected = data ? pickSelected(data, params.get('node')) : null

  let component = null
  if (isLoading) {
    component = <>
      <div style={{ textAlign: 'center' }} className="mt-30 mb-30" >
        <SpinnerCircular color={FLARE_COLOR_CODE} size={100} />
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
      <FlareValidatorLocalDelegateComponent selectedNodeId={selected.base.validatorNodeId} />
      <FlareValidatorOfficialDelegateComponent validatorLink={selected.delegation.validatorLink} />
      <FlareValidatorStatisticsComponent config={selected.graphics} />
    </>
  }

  // Picker lives top-right of the page title — only rendered once data
  // has loaded and a selection exists. ValidatorPicker hides itself
  // when validators.length <= 1 so a single-entry response still looks
  // like the original (pre-multi-validator) page.
  const picker = data && selected ? (
    <ValidatorPicker
      validators={data.map(d => d.base)}
      selectedNodeId={selected.base.validatorNodeId}
      onSelect={id => setParams({ node: id })}
      accentColor={FLARE_COLOR_CODE}
    />
  ) : null

  return <>
    <div className="single-project-page-design">
      <ProjectTitle
        title='Flare Validator Delegation'
        suptitle='Secure Flare Network Consensus Layer'
        rightSlot={picker}
      />
      <div className="container pt-30">
        <ProjectDescription />
        {component}
      </div>
    </div>
    {selected && <UnavailabilityBanner summary={selected.summary} />}
  </>
}

export default FlareValidatorPage