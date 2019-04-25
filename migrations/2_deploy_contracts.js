require("web3")

const Convertlib = artifacts.require("Convertlib");
const MetaCoin = artifacts.require("MetaCoin");
const Coin = artifacts.require("Coin");
const Ballot = artifacts.require("Ballot");
const SimpleAuction = artifacts.require("SimpleAuction");

module.exports = function(deployer) {
  deployer.deploy(Convertlib);
  deployer.link(Convertlib, MetaCoin);
  deployer.deploy(MetaCoin);
  deployer.deploy(SimpleAuction);
  proposals = [web3.utils.fromAscii("p1", 32), 
               web3.utils.fromAscii("p2", 32), 
               web3.utils.fromAscii("p3", 32)];
  deployer.deploy(Ballot, proposals)
  .then(function(instance){
    // call initial
    (async() => {
      let accounts = await web3.eth.getAccounts();
      // grant initial permission
      await instance.giveRightsToVoters(accounts.slice(0,3));
      // await instance.vote(1);
      // await instance.vote(1, {from: accounts[1]});
      // await instance.vote(10, {from: accounts[2]});
      let winner = await instance.winnerName();
      console.log(web3.utils.toAscii(winner));
      console.log('deploy success');
    })();
  });
};
