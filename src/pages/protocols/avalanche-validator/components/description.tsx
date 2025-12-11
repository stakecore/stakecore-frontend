const ProjectDescription = () => {
  return <div className="single-project-page-right wow fadeInUp delay-0-4s avalanche-div-border mb-30">
    <h2>Basic Information</h2>
    Avalanche runs on the proof of stake protocol called Snowball.
    Snowball requires validators to stake AVAX, which allows them to
    validate and broadcast network transactions. In return, validators are rewarded with network's inflation.

    Delegators can choose to contribute to validator's staked AVAX, earning the share of the
    inflation reward rate, offset by a small fee percentage that is defined via each validator defines.

    <div className="notification-block warning mt-10 mb-20">
      Avalanche staking takes place on its platform chain (P-chain), not the contract chain (C-chain),
      where most users hold their AVAX assets.
    </div>
  </div>
}

export default ProjectDescription