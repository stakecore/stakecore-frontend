import type { PChainValidatorInfoDto } from "~/backendApi"
import { Formatter } from "~/utils/misc/formatter"
import './validatorPicker.scss'


// Horizontal row of selectable validator chips. Rendered above the
// validator-page detail block on /flare/validator and /avalanche/validator
// when more than one validator is returned. The featured one is marked;
// selection is owned by the parent (URL-state friendly).
const ValidatorPicker = ({ validators, selectedNodeId, onSelect, accentColor }: {
  validators: PChainValidatorInfoDto[]
  selectedNodeId: string
  onSelect: (nodeId: string) => void
  accentColor: string
}) => {
  // Single-validator case: no picker needed.
  if (validators.length <= 1) return null

  return (
    <div className="validator-picker" role="tablist" aria-label="Select validator">
      {validators.map(v => {
        const active = v.validatorNodeId === selectedNodeId
        return (
          <button
            key={v.validatorNodeId}
            type="button"
            role="tab"
            aria-selected={active}
            className={`validator-picker-chip${active ? ' active' : ''}`}
            style={active ? { borderColor: accentColor } : undefined}
            onClick={() => onSelect(v.validatorNodeId)}
          >
            <div className="validator-picker-chip-top">
              <span className="validator-picker-chip-label">
                {Formatter.address(v.validatorNodeId, 5)}
              </span>
              {v.featured && (
                <span className="validator-picker-chip-featured" title="Featured validator">★</span>
              )}
            </div>
            <div className="validator-picker-chip-sub">
              Fee {v.validatorFee}%
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default ValidatorPicker
