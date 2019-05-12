/**
 * File: /Users/guchenghao/LuckyYou/Dapp/components/js/LuckYou.js
 * Project: /Users/guchenghao/LuckyYou/Dapp/components/js
 * Created Date: Sunday, April 28th 2019, 2:24:46 pm
 * Author: Harold Gu
 * -----
 * Last Modified:
 * Modified By:
 * -----
 * Copyright (c) 2019 HKUST
 * ------------------------------------
 * Javascript will save your soul!
 */


import Web3 from "web3";
import TruffleContract from 'truffle-contract';
// import '../components/css/warehouse.min.css'
// import '../components/libs/bootstrap/dist/js/bootstrap.min.js'
// import '../components/libs/bootstrap/dist/css/bootstrap.min.css'
// import '../components/libs/jquery/dist/'
import lotteryArtifact from "./contracts/LuckyYou.json";

const NONE_STR = "loading...";

const App = {

    web3Provider: null,
    account: null,
    accounts: [],
    contracts: {},
    view_scopes: {},

    start: async function () {
        const { web3 } = this;
        console.log('call start');
        try {
            // get contract instance
            const provider = this.web3.currentProvider;

            // get accounts
            const accounts = await web3.eth.getAccounts();
            this.accounts = accounts;
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
            this.contracts.lotteryInstsMap = new Map();

            // if (this.view_scopes.buyLotterycontroller) {
            //     var scope = this.view_scopes.buyLotterycontroller;
            //     scope.lotteryAccount = await this.revealAccounts();
            // }

        } catch (error) {
            console.error("Could not connect to contract or chain." + error);
        }
    },

    test: async function() {
        var scope = this.view_scopes.lotteryresultcontroller;
        scope.lotteryResult.push({
            endtime: "endtime1",
            totalPrice: "totalPrice1",
            winner: "winner1"
        });
    },

    createlottery: async function () {

        // if (this.contracts.lotteryInst) {
        //     var isEnded = await lotteryInst.ended.call();
        //     if (!isEnded) {
        //         console.log('lottery not ended yet!');s
        //         return;
        //     }
        // }
        // TODO aquire end time
        const timespan = this.getTimeSpan(); // in seconds
        // TODO aquire benificiary_address
        const beneficiary = this.getBeneficiary();
        // TODO aquire prize share ratio for winner
        const share_radio = this.getShareRatio(); // 1~100
        var lotteryInst = await this.contracts.lottery.new(timespan, beneficiary, share_radio);
        this.contracts.lotteryInsts.push(lotteryInst);
        this.contracts.lotteryInstsMap.set(lotteryInst.address, lotteryInst);

        this.contracts.lotteryInst = lotteryInst;

        this._startListeningEvents(lotteryInst);

        var endTimeBN = await lotteryInst.lotteryEndTime.call();
        var endTime = endTimeBN.toNumber() * 1000;
        // refresh current lottery address;
        this.refreshCurrentLotteryAddress(lotteryInst.address);
        // refresh end time as endTime
        this.refreshEndTime(endTime);
        // refresh prize
        this.refreshPrize(0);
        // refresh beneficiary
        this.refreshBeneficiary(beneficiary);
        // refresh winner as None.
        this.refreshWinner(NONE_STR);
    },

    joinlottery: async function (addr) {

        var lotteryInst;
        if (this.contracts.lotteryInstsMap.has(addr)) {
            lotteryInst = this.contracts.lotteryInstsMap.get(addr);
        } else {
            lotteryInst = await this.contracts.lottery.at(addr);
            this.contracts.lotteryInsts.push(lotteryInst);
            this.contracts.lotteryInstsMap.set(lotteryInst.address, lotteryInst);
        }
        this.contracts.lotteryInst = lotteryInst;

        this._startListeningEvents(lotteryInst);

        var winner = await lotteryInst.winner.call();
        var beneficiary = await lotteryInst.beneficiary.call();
        var endTimeBN = await lotteryInst.lotteryEndTime.call();
        var totalPrize = await lotteryInst.total_prize.call();

        var endTime = endTimeBN.toNumber() * 1000;
        // refresh current lottery address
        this.refreshCurrentLotteryAddress(lotteryInst.address)
        // TODO refresh end time as endTime
        this.refreshEndTime(endTime);
        // TODO refresh prize
        this.refreshPrize(totalPrize);
        // TODO refresh beneficiary
        this.refreshBeneficiary(beneficiary);
        // TODO refresh winner as None.
        this.refreshWinner(NONE_STR);
        // historical lottery
        if (endTime < (new Date()).getTime() || (winner!=undefined || winner != '' && winner.length == 42)) {
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
                // this.refreshPrize(winner_prize);
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
        try {
            var recepit = await lotteryInst.buy(this.web3.utils.fromAscii(words, 32), {
                from: buyer,
                value: amount
            });
            console.log(recepit);
        } catch(e) {
            console.log(error);
            if (error.reason == "lottery already edned.") {
                this.endLottery();
            }
        }
    },

    endLottery: async function() {

        var lotteryInst = this.contracts.lotteryInst;
        await lotteryInst.lotteryEnd();
        // .then(function (response) {
        //     console.log("lottery end." + response)
        // },
        // function (error) {
        //     console.log(error)
        // });
    },

    refreshCurrentLotteryAddress: async function (addr) {
        // TODO
        var scope = this.view_scopes.generateLotterycontroller;
        scope.curLottery.lottery_addr = addr;
    },

    refreshEndTime: async function (endTime) {
        const time = (new Date(endTime)).toISOString().replace(/T/, ' ').replace(/\..+/, '')
        // TODO
        var scope = this.view_scopes.generateLotterycontroller;
        scope.curLottery.endTime = time;
    },

    refreshPrize: async function (prize) {
        // TODO
        var scope = this.view_scopes.generateLotterycontroller;
        scope.curLottery.priceamount = String(prize);
    },

    refreshWinner: async function (winner) {
        // TODO
        var scope = this.view_scopes.generateLotterycontroller;
        scope.curLottery.winner = winner;
    },

    refreshBeneficiary: function (beneficiary) {
        // TODO
        var scope = this.view_scopes.generateLotterycontroller;
        scope.curLottery.bene_addr = beneficiary;
    },

    getTimeSpan: function() {
        // TODO retunr in seconds
        var scope = this.view_scopes.generateLotterycontroller;
        return scope.curLottery.timespan;
    },

    getBeneficiary: function() {
        // TODO
        var scope = this.view_scopes.generateLotterycontroller;
        return scope.curLottery.beaddress;
    },

    getShareRatio: function() {
        // TODO
        var scope = this.view_scopes.generateLotterycontroller;
        return scope.curLottery.PPrice;
    },

    revealAccounts: async function(accs) {

        // var result = []
        for (var i = 0; i < this.accounts.length; i++) {
            var address = this.accounts[i];
            var idx = accs.findIndex(item => address == item.address);
            var acc;
            if (idx == -1) {
                acc = {}
                acc.address = address;
                accs.push(acc);
            } else {
                acc = accs[idx];
            }
            var balance_BN = await this.web3.eth.getBalance(address);
            acc.balance = String(balance_BN);
        }

        // return result;
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