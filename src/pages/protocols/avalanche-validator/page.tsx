import useSWR from 'swr'
import { useSearchParams } from 'react-router-dom'
import { SpinnerCircular } from 'spinners-react'
import ServerError from '~/components/ui/serverError'
import ProjectTitle from "../title"
import ProjectDescription from './components/description'
import InfoComponent from "../info"
import UnavailabilityBanner from "../unavailabilityBanner"
import ValidatorPicker from "../validatorPicker"
import AvalancheValidatorStatisticsComponent from "./components/statistics"
import AvalancheValidatorOfficialDelegateComponent from "./components/delegateOfficial"
import AvalancheValidatorDataAccess from "./data"
import { AVALANCHE_COLOR_CODE } from '~/constants'
import '../protocols.scss'


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

export const AvalancheValidatorPage = () => {
  const { data, error, isLoading } = useSWR('avalanche-validator-page', (_) => AvalancheValidatorDataAccess.getAvalanchePageData())
  const [params, setParams] = useSearchParams()
  const selected = data ? pickSelected(data, params.get('node')) : null

  let component = null
  if (isLoading) {
    component = <>
      <div style={{ textAlign: 'center' }} className="mt-30 mb-30" >
        <SpinnerCircular color={AVALANCHE_COLOR_CODE} size={100} />
      </div>
    </>
  } else if (error != null || !selected) {
    component = <ServerError error={error} />
  } else {
    component = <>
      <InfoComponent specs={selected.specs} summary={selected.summary} />
      <AvalancheValidatorOfficialDelegateComponent validatorLink={selected.delegation.validatorLink} />
      <AvalancheValidatorStatisticsComponent config={selected.graphics} />
    </>
  }

  const picker = data && selected ? (
    <ValidatorPicker
      validators={data.map(d => d.base)}
      selectedNodeId={selected.base.validatorNodeId}
      onSelect={id => setParams({ node: id })}
      accentColor={AVALANCHE_COLOR_CODE}
    />
  ) : null

  return <>
    <div className="single-project-page-design">
      <ProjectTitle
        title='Avalanche Validator Delegation'
        suptitle='Secure Avalanche Network Consensus Layer'
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

export default AvalancheValidatorPage