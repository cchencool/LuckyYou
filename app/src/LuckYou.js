import Web3 from "web3";
import TruffleContract from 'truffle-contract'
import lotteryArtifact from "./contracts/LuckyYou.json";

const NONE_STR = "loading...";

const App = {

    web3Provider: null,
    account: null,
    contracts: {},

    start: async function () {
        const { web3 } = this;

        try {
            // get contract instance
            const provider = this.web3.currentProvider;

            // get accounts
            const accounts = await web3.eth.getAccounts();
            this.account = accounts[0];

            var lottery = TruffleContract(lotteryArtifact);
            lottery.setProvider(provider);
            lottery.defaults({
                from: this.account,
                gas: 3000000,
            })
            this.contracts.lottery = lottery;
            this.contracts.lotteryInst;
            this.contracts.lotteryInsts = [];
            this.contracts.lotteryInstsMap = {};
        } catch (error) {
            console.error("Could not connect to contract or chain." + error);
        }
    },

    createlottery: async function () {

        var lotteryInst;
        if (!this.contracts.lotteryInst) {
            // TODO aquire end time
            const timespan = this.getTimeSpan(); // in seconds
            // TODO aquire benificiary_address
            const beneficiary = this.getBeneficiary();
            // TODO aquire prize share ratio for winner
            const share_radio = this.getShareRatio(); // 1~100
            lotteryInst = await this.contracts.lottery.new(timespan, beneficiary, share_radio);
            this.contracts.lotteryInsts.push(lotteryInst);
            this.contracts.lotteryInstsMap[lotteryInst.address] = lotteryInst;
            this.undergoing = true;
        } else {
            lotteryInst = this.contracts.lotteryInst[0];
        }
        this.contracts.lotteryInst = lotteryInst;

        this._startListeningEvents(lotteryInst);

        var endTimeBN = await lotteryInst.lotteryEndTime.call();
        var endTime = endTimeBN.toNumber() * 1000;
        // refresh current lottery address;
        this.refreshCurrentLotteryAddress(lotteryInst.address);
        // refresh end time as endTime
        this.refreshEndTime(endTime);
        // refresh prize
        this.refreshPrize(totalPrize);
        // refresh beneficiary
        this.refreshBeneficiary(beneficiary);
        // refresh winner as None.
        this.refreshWinner(NONE_STR);
    },

    joinlottery: async function (addr) {
        
        var lotteryInst;
        if (addr in this.contracts.lotteryInstsMap) {
            lotteryInst = this.contracts.lotteryInstsMap[addr];
        } else {
            lotteryInst = await this.contracts.lottery.at(addr);
            this.contracts.lotteryInsts.push(lotteryInst);
            this.contracts.lotteryInstsMap[lotteryInst.address] = lotteryInst;
        }
        this.contracts.lotteryInst = lotteryInst;

        this._startListeningEvents(lotteryInst);

        var beneficiary = await lotteryInst.beneficiary.call();
        var endTimeBN = await lotteryInst.lotteryEndTime.call()
        var totalPrize = await lotteryInst.total_prize.call();

        var endTime = endTimeBN.toNumber() * 1000;
        // TODO refresh end time as endTime
        this.refreshEndTime(endTime);
        // TODO refresh prize
        this.refreshPrize(totalPrize);
        // TODO refresh beneficiary
        this.refreshBeneficiary(beneficiary);
        // TODO refresh winner as None.
        this.refreshWinner(NONE_STR);
        // historical lottery
        if (endTime < (new Date()).getTime()) {
            // TODO refresh winner
            this.refreshWinner(winner);
            // remove ended instance.
            this.contracts.lotteryInsts.pop();
        }
    },

    _startListeningEvents: async function (lotteryInst) {

        // listening event method 1
        lotteryInst.totalPrizeUpdated({}, (error, response) => {
            if (!error) {
                let retvals = response.returnValues;
                var totalPrize = String(retvals.totoal_prize);
                // refresh prize
                this.refreshPrize(totalPrize);
            } else {
                console.log(error);
            }
        });

        lotteryInst.lotteryEnded({}, (error, response) => {
            if (!error) {
                this.undergoing = false;
                let retvals = response.returnValues;
                let winner = retvals.winner;
                var winner_prize = String(retvals.winner_prize);
                // var beneficiary_prize = String(retvals.beneficiary_prize);
                // refresh total_prize
                this.refreshPrize(winner_prize);
                // refresh winner as None.
                this.refreshWinner(winner);
                this.contracts.lotteryInsts.pop();
            } else {
                console.log(error);
            }
        });

        // start a end timmer;
        const timespan = this.getTimeSpan(); // in seconds
        var endTimmer = setTimeout(() => {
            this.endLottery();
        }, (timespan+3)*1000);
        this.endTimeer = endTimmer;
    },

    buy: async function (buyer, amount, words) {

        var lotteryInst = this.contracts.lotteryInst;
        lotteryInst.buy(words, {from: buyer, value: amount}).then(
            function (response) {
                // success
                console.log(response);
            },
            function (error) {
                console.log(error);
                if (error.reason == "lottery already edned.") {
                    this.endLottery();
                }
            }
        )
    },

    endLottery: async function() {

        var lotteryInst = this.contracts.lotteryInst;
        lotteryInst.lotteryEnd().then(function (response) {
            console.log("lottery end." + response)
        },
        function (error) {
            console.log(error)
        });
    },

    refreshEndTime: async function (endTime) {
        const time = (new Date(endTime)).toISOString().replace(/T/, ' ').replace(/\..+/, '')
        // TODO
    },

    refreshPrize: async function (prize) {
        // TODO
    },

    refreshWinner: async function (winner) {
        // TODO
    },

    refreshBeneficiary: function (beneficiary) {
        // TODO
    },

    getTimeSpan: function() {
        // TODO retunr in seconds
    },

    getBeneficiary: function() {
        // TODO
    },

    getShareRatio: function() {
        // TODO
    }, 

    revealAccounts: function() {
        return JSON.parse(JSON.stringify(this.accounts));
    }
}

window.App = App;

window.addEventListener("load", function () {
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

module.exports = App;