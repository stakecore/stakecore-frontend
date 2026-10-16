const ProjectDescription = () => {
  return <div className="single-project-page-right mb-30">
    <h2>Basic Information</h2>
    <p>
      Every blockchain needs a way to agree on which transactions happened and in what order. On
      Flare, that is the job of validators: computers that check new transactions and add them to
      the chain. Flare uses the same proof-of-stake design as Avalanche, where each validator puts up
      FLR as a stake, and the more stake behind a validator, the more weight its vote carries. In
      return, validators and the people backing them earn FLR rewards.
    </p>
    <p>
      You can add your FLR to a validator's stake by delegating to it. Your tokens never leave your
      own wallet, but unlike delegating to an FSP provider, they are staked for a fixed term:
    </p>
    <dl className="protocol-parts mb-0">
      <div>
        <dt>Amount and term</dt>
        <dd>
          There is a minimum amount, and the delegation runs for a period you choose, at least 14
          days and never past the validator's own end date. Both limits are in the summary below.
          Until the delegation ends, your FLR is locked and cannot be withdrawn early.
        </dd>
      </div>
      <div>
        <dt>Two chains</dt>
        <dd>
          Your wallet normally holds FLR on Flare's contract chain (C-chain), but staking happens on
          its platform chain (P-chain). To delegate, you first move FLR from the C-chain to the
          P-chain, and move it back once the delegation ends.
        </dd>
      </div>
      <div>
        <dt>Rewards</dt>
        <dd>
          Paid every 14 days on the C-chain, not on the P-chain where your stake sits. They depend on
          the validator staying online at least 80% of the time and on its operator meeting the
          Flare Systems Protocol's requirements, minus the validator's fee.
        </dd>
      </div>
    </dl>
  </div>
}

export default ProjectDescription
