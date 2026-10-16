const ProjectDescription = () => {
  return <div className="single-project-page-right mb-30">
    <h2>Basic Information</h2>
    <p>
      Flare is a blockchain with data built in. Besides processing transactions, the network
      publishes prices and other outside information that apps on Flare can rely on. That data
      comes from independent data providers like StakeCore, working under the Flare Systems
      Protocol (FSP). The protocol has three parts:
    </p>
    <dl className="protocol-parts">
      <div>
        <dt>FTSO (Flare Time Series Oracle)</dt>
        <dd>
          Every 90 seconds, each provider submits its own prices, and the network combines them
          into a single price feed.
        </dd>
      </div>
      <div>
        <dt>Fast Updates</dt>
        <dd>
          Between those rounds, providers adjust the prices up or down a little on every block
          (about every 1.8 seconds), so the feeds stay current.
        </dd>
      </div>
      <div>
        <dt>FDC (Flare Data Connector)</dt>
        <dd>
          Providers confirm that something happened on another blockchain, such as a Bitcoin or XRP
          payment, so contracts on Flare can act on it.
        </dd>
      </div>
    </dl>
    <p>
      Providers need FLR holders to back them, and holders do that by delegating. You wrap your FLR
      into WFLR (one to one, reversible at any time) and assign its weight to up to two providers.
      Your tokens never leave your wallet, there is no lock-up, and you can unwrap or move them
      whenever you like.
    </p>
    <p className="mb-0">
      Rewards are paid each reward epoch, which lasts 3.5 days. What you earn depends on how much
      you delegated and how well your provider performed in that epoch, minus the provider's fee.
      A provider that misses the protocol's minimum requirements can lose that epoch's rewards,
      and its delegators lose theirs with it. That's why the charts below show our record over the
      last 25 reward epochs (about three months).
    </p>
  </div>
}

export default ProjectDescription
