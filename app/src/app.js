// in node.js use: const Web3 = require('web3');
Web3 = require('web3');
// require("truffle-contract");
// use the given Provider, e.g in the browser with Metamask, or instantiate a new websocket provider
// const web3 = new Web3(Web3.givenProvider || 'ws://localhost:8546', null, {});
// const web3 = new Web3('ws://localhost:7545', null, {});
const web3 = new Web3(new Web3.providers.WebsocketProvider('ws://localhost:7545'), null, {});
// const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:7545"));

(async() => {
    var accounts = await web3.eth.getAccounts();
    proposals=[web3.utils.fromAscii("p1", 32), web3.utils.fromAscii("p2", 32), web3.utils.fromAscii("p4", 32)]
    console.log(proposals);
    console.log(accounts);
    console.log('done');
    process.exit();
})();