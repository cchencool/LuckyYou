
var Web3 = require('web3');
var TruffleContract = require("truffle-contract");
var path = require('path');
var fs = require("fs");
var AsyncLock = require('async-lock');
var sleep = require('sleep');
var table = require('table');
// import {table} from 'table';

// var MyContract = require("../build/contracts/MyContract.json");
// var Utilslib = require("../build/contracts/Utilslib.json");

var provider = new Web3.providers.WebsocketProvider("ws://127.0.0.1:7545");
var web3 = new Web3(provider);
const jsonPath = path.join(__dirname, './contracts/LuckyYou.json');
const MyContractArtifact = JSON.parse(fs.readFileSync(jsonPath));

var MyContract = TruffleContract(MyContractArtifact);
MyContract.setProvider(provider);

const DEBUG_CONTRACT = false;
const TESTCOUNT = DEBUG_CONTRACT ? 1 : 50;

// var PROPOSAL_COUNT = 3;
// var proposals = [];
// for (var i=0; i < PROPOSAL_COUNT; i++){
//     proposals.push(web3.utils.fromAscii("proposal-" + ("" + i).padStart(2, '0'), 32));
// }
// var proposals=[web3.utils.fromAscii("proposal-00", 32), web3.utils.fromAscii("proposal-01", 32), web3.utils.fromAscii("proposal-02", 32)];
// MyContract.link(Utilslib);

const created_player = "0xEA6A83414a473567CB7Ae10B8E59491BB2Bd8873";

(async() => {
    // function getRandomInt(max) {
    //     return Math.floor(Math.random() * Math.floor(max));
    // }

    // async function voting(instance) {
    //     for (var i = 0; i < GRANT_USER_TO; i ++) {
    //         vote_to = getRandomInt(PROPOSAL_COUNT);
    //         await instance.vote(vote_to, {from: accounts[i]});
    //     }
    // }
    
    // // contract_address = "0xB9B9FDCCdC76F5f8a5940DC80e86120684a697a5";
    var accounts = await web3.eth.getAccounts();
    MyContract.defaults({
        from: accounts[0],
        gas: 3000000,
    });

    var counter_finished = 0;
    var winner_dict = {};
    var lock = new AsyncLock();
    if (DEBUG_CONTRACT) {
        await start_lottery(accounts, true);
    } else {
        for (var i = 0; i < TESTCOUNT; i++) {
            console.log(i + 'th brought.');
            start_lottery(accounts, true).then((winner_idx) => {
                lock.acquire(winner_dict, () => {
                    counter_finished ++;
                    if (winner_idx in winner_dict) {
                        winner_dict[winner_idx] += 1;
                    } else {
                        winner_dict[winner_idx] = 1;
                    }
                    // final output
                    if (counter_finished >= TESTCOUNT) {
                        // format
                        var table_data = [['player', 'winning chance']];
                        for (k = 0; k < accounts.length; k ++) {
                            idx = k + 1;
                            table_data[idx] = [];
                            table_data[idx].push(k);
                            table_data[idx].push(k in winner_dict ? winner_dict[k] / TESTCOUNT : 0);
                        }
                        var output = table.table(table_data);
                        // console.log(table_data);
                        console.log(output);
                        process.exit();
                    }
                });
            }).catch(error => console.log(error));
        }
    }
    console.log('done');

    // console.log(accounts);
    // console.log(proposals);
    // // var instance = await MyContract.deployed();
    // var instance = await MyContract.new(proposals, {from: accounts[0]});
    // // console.log(instance);
    // console.log('deploy success...');
    // console.log('instance.address --> ' + instance.address)
    // await instance.giveRightsToVoters(accounts.slice(1,GRANT_USER_TO), {from: accounts[0]});
    // console.log('initial rights done...');
    // await voting(instance);
    // // await instance.vote(0, {from: accounts[1]});
    // // await instance.vote(2, {from: accounts[2]});
    // console.log('voting done...');
    // let winner = await instance.winnerName({from: accounts[0]});
    // console.log("the winner is " + web3.utils.toAscii(winner));
    
})();

async function start_lottery(accounts, log=false) { 
    let inst = await MyContract.new(60, accounts[1], 80);

    if (DEBUG_CONTRACT) {
        inst.lotteryEnded().on('data', response => {
            let retvals = response.returnValues;
            var winner_prize = String(retvals.winner_prize);
            var winner = retvals.winner;
            var ith = accounts.indexOf(winner);
            if (log) {
                console.log("winner is " + ith + "th account: " + winner + ", winner prize is " + to_either(winner_prize));
            }
            process.exit();
        }).on('error', error => console.log);
        // await inst.lotteryEnded({}, (error, response) => {
        //     let retvals = response.returnValues;
        //     var winner_prize = String(retvals.winner_prize);
        //     var winner = retvals.winner;
        //     var ith = accounts.indexOf(winner);
        //     if (log) {
        //         console.log("winner is " + ith + "th account: " + winner + ", winner prize is " + to_either(winner_prize));
        //     }
        //     process.exit();
        // });
    }

    await buy(inst, accounts, log);
    try {
        await inst.lotteryEnd();
    }
    catch(e) {
        console.log(e)
    }

    if (!DEBUG_CONTRACT) {
        var winner = await inst.winner.call();
        var winner_prize = await inst.prize_for_winner.call()
        var beneficiary_prize = await inst.prize_for_beneficiary.call()
        var ith = accounts.indexOf(winner);
        if (log) {
            console.log("winner is " + ith + "th account: " + winner + ", winner prize is " + to_either(winner_prize) + ", beneficiary prize is: " + to_either(beneficiary_prize));
        }
        return ith;
    }
}


async function buy(inst, accounts, log=false) {
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var seed = 6000;
    function random(use_seed=false) {
        if (use_seed) {
            var x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        } else {
            return Math.random();
        }
    }
    for (var i = 0; i < accounts.length; i++) {
        var buyer = accounts[i];
        var val = 5e17;
        var words = '';
        for(j = 0; j < 5; j ++) {
            words += characters.charAt(Math.floor((random() * characters.length)));
        }
        words32 = web3.utils.fromAscii(words, 32);
        // await inst.buy(words32, {from:buyer, value:val});
        sleep.msleep(50);
        inst.buy(words32, {from:buyer, value:val});
        if (log) {
            console.log(i + "th buyer: " + buyer + "; val: " + to_either(val) + " ether; words: " + words);
        }
    }
}

function to_either(wei) {
    return web3.utils.fromWei(String(wei), "ether");
}