import Web3 from "web3";
import TruffleContract from 'truffle-contract'
import auctionArtifact from "./contracts/SimpleAuction.json";

const NONE_STR = "loading...";

const App = {

  web3Provider: null,
  account: null,
  contracts: {},
  undergoing: false,

  start: async function() {
    const { web3 } = this;

    try {
      // get contract instance
      // const networkId = await web3.eth.net.getId();
      // const deployedNetwork = auctionArtifact.networks[networkId];
      const provider = this.web3.currentProvider;
      
      // get accounts
      const accounts = await web3.eth.getAccounts();
      this.account = accounts[0];

      // this.meta = new web3.eth.Contract(
        // auctionArtifact.abi,
        // deployedNetwork.address,
      // );
      var auction = TruffleContract(auctionArtifact);
      auction.setProvider(provider);
      auction.defaults({
        from: this.account,
        gas: 3000000,
      })
      this.contracts.auction = auction;
      this.contracts.auctionInsts = [];
      // this.contracts.auctionInst = await auction.at("0xfb4990d8cB716AbeabeE9cb3641C85bcC2E3e570")//deployed()
      // this.refreshBalance();
    } catch (error) {
      console.error("Could not connect to contract or chain." + error);
    }
  },

  startAuction: async function() {

    if (this.undergoing) {
      console.log('already started');
    }

    var auctionInst;
    if (!this.contracts.auctionInst) {
      const bidtimelimit = parseInt(document.getElementById("bidtimelimit").value);
      const benificiary_address = document.getElementById("benificiary_address").value;
      auctionInst = await this.contracts.auction.new(bidtimelimit, benificiary_address);
      this.contracts.auctionInsts.push(auctionInst);
      this.undergoing = true;
    } else {
      auctionInst = this.contracts.auctionInst[0];
    }

    this.startListeningEvents(auctionInst);
    
    var endTimeBN = await auctionInst.auctionEndTime.call();
    var endTime = endTimeBN.toNumber() * 1000;
    this.refreshEndTime(endTime);
    this.refreshHighestBidding(NONE_STR, NONE_STR);
    this.refreshWinner(NONE_STR, NONE_STR);
  },

  joinAuction: async function() {
    if (this.undergoing) {
      console.log('already started');
    }
    const join_auction = document.getElementById("join_auction").value;
    const auctionInst = await this.contracts.auction.at(join_auction);
    this.contracts.auctionInsts.push(auctionInst);
    this.undergoing = true;

    this.startListeningEvents(auctionInst);

    var endTimeBN = await auctionInst.auctionEndTime.call()
    var highestAmount = await auctionInst.highestBid.call();
    var highestBidder = await auctionInst.highestBidder.call();

    var endTime = endTimeBN.toNumber() * 1000;
    this.refreshEndTime(endTime);
    this.refreshHighestBidding(highestBidder, highestAmount);
    this.refreshWinner(NONE_STR, NONE_STR);
    
    if (endTime < (new Date()).getTime()) {
      this.refreshWinner(highestBidder, highestAmount);
      this.contracts.auctionInsts.pop();
      this.undergoing = false;
    }
  },

  startListeningEvents: async function(auctionInst) {
    
    // listening event method 1
    var incEvent = await auctionInst.HighestBidIncreased({}, (error, response) => {
      if (!error) {
        let retvals = response.returnValues;
        var amount = String(retvals.amount);
        this.refreshHighestBidding(retvals.bidder, amount);
      } else {
        console.log(error);
      }
    });

    // listening event method 2
    // auctionInst.HighestBidIncreased().on("data", (event) => {
    //   let retvals = event.returnValues;
    //   var amount = String(retvals.amount);
    //   // We can access this event's 3 return values on the `event.returnValues` object:
    //   console.log("retunr vals:", retvals.bidder, retvals.amount);
    //   this.refreshHighestBidding(retvals.bidder, retvals.amount);
    // }).on("error", console.error);

    var endedEvent = await auctionInst.AuctionEnded({}, (error, response) => {
      if (!error) {
        this.undergoing = false;
        let retvals = response.returnValues;
        var amount = String(retvals.amount);
        this.refreshWinner(retvals.winner, amount);
        var inst = this.contracts.auctionInsts.pop();
        inst.withdraw(); // bug here
      } else { 
        console.log(error);
      } 
    });
       
    const currentAuctionEle = document.getElementById("currentAuction");
    currentAuctionEle.innerHTML = auctionInst.address;
  },

  bid: async function() {
    const amount = parseInt(document.getElementById("biding_price").value);

    var auctionInst  = this.contracts.auctionInsts[0];
    auctionInst.bid({value: amount}).then(
      function(response) {
        console.log(response);
      },
      function(error) {
        console.log(error);
        if (error.reason == "Auction already edned.") {
          auctionInst.auctionEnd().then(function(response) {
            console.log("aution end." + response)
          },
          function(error) {
            console.log(error)
          });
          App.setStatus("Transaction complete!");
        }
      }
    )
  },

  refreshEndTime: async function(endTime) {
    const endTimeEle = document.getElementById("endTime");
    endTimeEle.innerHTML = (new Date(endTime)).toISOString().replace(/T/, ' ').replace(/\..+/, '')
  },

  refreshHighestBidding: async function(bidder, amount) {
    const highestBidderEle = document.getElementById("highestBidder");
    highestBidderEle.innerHTML = bidder;

    const highestAmountEle = document.getElementById("highestAmount");
    highestAmountEle.innerHTML = amount;
  },

  refreshWinner: async function(winner, amount) {
    const winnerBidderEle = document.getElementById("winnerBidder");
    winnerBidderEle.innerHTML = winner;

    const winnerAmountEle = document.getElementById("winnerAmount");
    winnerAmountEle.innerHTML = amount;    

    this.setStatus("Auction Finished!")
  },

  setStatus: function(message) {
    const status = document.getElementById("status");
    status.innerHTML = message;
  },
  
}

window.App = App;

window.addEventListener("load", function() {
  // if (window.ethereum) {
  //   // use MetaMask's provider
  //   App.web3 = new Web3(window.ethereum);
  //   window.ethereum.enable(); // get permission to access accounts
  // } else {
    console.warn(
      "No web3 detected. Falling back to http://127.0.0.1:7545. You should remove this fallback when you deploy live",
    );
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    App.web3 = new Web3(
      // new Web3.providers.HttpProvider("http://127.0.0.1:7545"),
      new Web3.providers.WebsocketProvider("ws://127.0.0.1:7545"),
    );
  // }

  App.start();
});
