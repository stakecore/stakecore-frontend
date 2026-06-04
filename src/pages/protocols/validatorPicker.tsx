import { useEffect, useRef, useState } from "react"
import type { PChainValidatorInfoDto } from "~/backendApi"
import { Formatter } from "~/utils/misc/formatter"
import './validatorPicker.scss'


// Custom dropdown floated top-right of the page title on
// /flare/validator and /avalanche/validator when more than one
// validator is returned. Built as a button-plus-popup rather than a
// native <select> so the open menu inherits the page's dark palette
// instead of the OS dropdown chrome. Selection is owned by the parent
// (URL-state friendly).
const ValidatorPicker = ({ validators, selectedNodeId, onSelect, accentColor }: {
  validators: PChainValidatorInfoDto[]
  selectedNodeId: string
  onSelect: (nodeId: string) => void
  accentColor: string
}) => {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click / Escape so the menu behaves like a real
  // popover and isn't trapped open when the user looks elsewhere.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Single-validator case: no picker needed.
  if (validators.length <= 1) return null

  const selected = validators.find(v => v.validatorNodeId === selectedNodeId) ?? validators[0]

  return (
    <div
      ref={containerRef}
      className={`validator-picker${open ? ' open' : ''}`}
      style={{ '--validator-picker-accent': accentColor } as React.CSSProperties}
    >
      <button
        type="button"
        className="validator-picker-trigger"
        aria-haspopup="listbox"
        aria-label="Select validator"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        <span className="validator-picker-value">
          {Formatter.address(selected.validatorNodeId, 10)}
          {selected.featured && (
            <span className="validator-picker-star" aria-label="Featured">★</span>
          )}
        </span>
        <svg
          className="validator-picker-chevron"
          width="10"
          height="6"
          viewBox="0 0 10 6"
          aria-hidden
        >
          <path
            d="M1 1l4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <ul className="validator-picker-menu" role="listbox" aria-label="Select validator">
          {validators.map(v => {
            const active = v.validatorNodeId === selectedNodeId
            return (
              <li key={v.validatorNodeId} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`validator-picker-option${active ? ' active' : ''}`}
                  onClick={() => {
                    onSelect(v.validatorNodeId)
                    setOpen(false)
                  }}
                >
                  <span className="validator-picker-option-label">
                    {Formatter.address(v.validatorNodeId, 10)}
                  </span>
                  {v.featured && (
                    <span className="validator-picker-star" aria-label="Featured">★</span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default ValidatorPicker
