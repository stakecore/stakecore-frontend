const ProjectDescription = () => {
  return <div className="single-project-page-right mb-30">
    <h2>Basic Information</h2>
    <p>
      Every blockchain needs a way to agree on which transactions happened and in what order. On
      Avalanche, that is the job of validators: computers that check new transactions and add them
      to the chain. Avalanche is proof of stake, so each validator puts up AVAX as a stake, and the
      more stake behind a validator, the more weight its vote carries. In return, validators and the
      people backing them are rewarded with newly issued AVAX.
    </p>
    <p>
      You can add your AVAX to a validator's stake by delegating to it. Your tokens never leave your
      own wallet, but they are staked for a fixed term:
    </p>
    <dl className="protocol-parts mb-0">
      <div>
        <dt>Amount and term</dt>
        <dd>
          There is a minimum amount, and the delegation runs for a period you choose, at least 14
          days and never past the validator's own end date. Both limits are in the summary below.
          Until the delegation ends, your AVAX is locked and cannot be withdrawn early.
        </dd>
      </div>
      <div>
        <dt>Two chains</dt>
        <dd>
          Your wallet normally holds AVAX on Avalanche's contract chain (C-chain), but staking
          happens on its platform chain (P-chain). To delegate, you first move AVAX from the C-chain
          to the P-chain, and move it back once the delegation ends.
        </dd>
      </div>
      <div>
        <dt>Rewards</dt>
        <dd>
          Paid in one go on the P-chain when the delegation ends, together with your stake, minus
          the validator's fee. They are all or nothing: if the validator was online less than 90% of
          the time, the delegation earns no reward at all.
        </dd>
      </div>
    </dl>
  </div>
}

export default ProjectDescription
