const ProjectDescription = () => {
  return <div className="single-project-page-right wow fadeInUp delay-0-4s mb-30">
    <h2>Basic Information</h2>
    Flare network adapts the Avalanche's proof of stake protocol named Snowball.
    The protocol is the basis for the network consensus, which requires validators
    to stake funds, and broadcast and validate network transactions.

    However, Flare modifies the rewarding structure by binding it to the Flare Systems Protocol performance and distributing
    rewards in 14 day cycles on C-chain (EVM chain) instead of the P-chain (platform chain).

    <div className="notification-block warning mt-10 mb-20">
      Even though Flare staking rewards are distributed on the C-chain, staking still takes place on its platform chain (P-chain).
    </div>
  </div>
}

export default ProjectDescription