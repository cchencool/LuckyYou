
var Web3 = require('web3');
var TruffleContract = require("truffle-contract");
var path = require('path');
var fs = require("fs");

// var MyContract = require("../build/contracts/MyContract.json");
// var Utilslib = require("../build/contracts/Utilslib.json");

var provider = new Web3.providers.HttpProvider("http://127.0.0.1:7545");
var web3 = new Web3(provider);
const jsonPath = path.join(__dirname, './contracts/Ballot.json');
const MyContractArtifact = JSON.parse(fs.readFileSync(jsonPath));

var MyContract = TruffleContract(MyContractArtifact);
MyContract.setProvider(provider);

var PROPOSAL_COUNT = 3;
var GRANT_USER_TO = 4;

var proposals = [];
for (var i=0; i < PROPOSAL_COUNT; i++){
    proposals.push(web3.utils.fromAscii("proposal-" + ("" + i).padStart(2, '0'), 32));
}
// var proposals=[web3.utils.fromAscii("proposal-00", 32), web3.utils.fromAscii("proposal-01", 32), web3.utils.fromAscii("proposal-02", 32)];
// MyContract.link(Utilslib);

const created_player = "0xEA6A83414a473567CB7Ae10B8E59491BB2Bd8873";

(async() => {
    function getRandomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
    }

    async function voting(instance) {
        for (var i = 0; i < GRANT_USER_TO; i ++) {
            vote_to = getRandomInt(PROPOSAL_COUNT);
            await instance.vote(vote_to, {from: accounts[i]});
        }
    }

    // contract_address = "0xB9B9FDCCdC76F5f8a5940DC80e86120684a697a5";
    var accounts = await web3.eth.getAccounts();
    console.log(accounts);
    console.log(proposals);
    // var instance = await MyContract.deployed();
    var instance = await MyContract.new(proposals, {from: accounts[0]});
    // console.log(instance);
    console.log('deploy success...');
    console.log('instance.address --> ' + instance.address)
    await instance.giveRightsToVoters(accounts.slice(1,GRANT_USER_TO), {from: accounts[0]});
    console.log('initial rights done...');
    await voting(instance);
    // await instance.vote(0, {from: accounts[1]});
    // await instance.vote(2, {from: accounts[2]});
    console.log('voting done...');
    let winner = await instance.winnerName({from: accounts[0]});
    console.log("the winner is " + web3.utils.toAscii(winner));
    console.log('done');
    process.exit();
})();
