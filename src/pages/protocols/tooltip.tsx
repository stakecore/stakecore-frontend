// The info affordance on spec-table row labels. It is a <button> rather than
// the <div> it started as, because the sentence it carries exists nowhere
// else: a div is not focusable, so the text was reachable by pointer hover
// only (WCAG 2.1.1 Keyboard), and the icon had no text alternative at all
// (1.1.1 Non-text Content). react-tooltip opens on focus as well as hover, so
// making the trigger focusable is the whole fix for the visual tooltip too.
//
// The accessible name is the tooltip text itself, not a generic "more
// information" — the visual tooltip never opens for a screen-reader user, so
// a name that only promises detail would leave them with no way to get it.
const SpecsTooltip = ({ text }) => {
  return (
    <button
      type="button"
      data-tooltip-id="tooltip"
      data-tooltip-content={text}
      className="specs-table-info"
      aria-label={text}
    >
      <svg aria-hidden="true" focusable="false" stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
        <path fill="none" d="M0 0h24v24H0V0z"></path>
        <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"></path>
      </svg>
    </button>
  )
}

export default SpecsTooltip
