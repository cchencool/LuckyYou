
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
const WORD_LENGTH = 10;
const TESTCOUNT = DEBUG_CONTRACT ? 1 : 1000;
const BLOCKCOUNT = DEBUG_CONTRACT ? 1 : 10;
var COUNTER = 0;
var COUNTER_FINISHED = 0;
var CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
var SEED = 6000;
var WINNER_DICT = {};
// var PROPOSAL_COUNT = 3;
// var proposals = [];
// for (var i=0; i < PROPOSAL_COUNT; i++){
//     proposals.push(web3.utils.fromAscii("proposal-" + ("" + i).padStart(2, '0'), 32));
// }
// var proposals=[web3.utils.fromAscii("proposal-00", 32), web3.utils.fromAscii("proposal-01", 32), web3.utils.fromAscii("proposal-02", 32)];
// MyContract.link(Utilslib);

const created_player = "0xEA6A83414a473567CB7Ae10B8E59491BB2Bd8873";

(async () => {
    // // contract_address = "0xB9B9FDCCdC76F5f8a5940DC80e86120684a697a5";
    var accounts = await web3.eth.getAccounts();
    // var account = []
    // for (i = 0; i < _accounts.length; i ++) {
    //     accounts.push(Upper)
    // }
    MyContract.defaults({
        from: accounts[0],
        gas: 3000000,
    });

    for (var j = 0; j < TESTCOUNT / BLOCKCOUNT; j ++) {

        console.time('round cost')
        let promise = new Promise(function(resolve, reject){
            var lock = new AsyncLock();
            var insts = []
            // if (DEBUG_CONTRACT) {
                // await start_lottery(accounts, true);
            // } else {
            for (var i = 0; i < BLOCKCOUNT; i++) {
                console.log((j*BLOCKCOUNT + i + '').padStart(3, '0') + 'th brought.');
                var inst = start_lottery(accounts, lock, j + 1, async () => {
                    // for (i = 0; i < insts.length; i++) {
                        // inst.
                    // }
                    // if not async sleep before exit, WS will throw errors in Ganache.
                    resolve("done");
                    // sleep.sleep(1);
                    // process.exit();
                }, true);
                insts.push(inst);
            }
            // }
            console.log('done');
        })

        await promise;
        console.timeEnd('round cost');
        // console.timeLog('round cost');


    }

    sleep.sleep(1);
    process.exit();

})();

async function start_lottery(accounts, lock, round, callback=async function(){}, log=false) { 
    let inst = await MyContract.new(60, accounts[1], 80);

    // await inst.lotteryEnded().on('data', response => {
    inst.lotteryEnded;
    inst.lotteryEnded({}, (error, response) => {
        if (error) {
            console.log(error);
            return;
        }
        let retvals = response.returnValues;
        var winner_prize = String(retvals.winner_prize);
        var benificiary_prize = String(retvals.beneficiary_prize);
        var winner = retvals.winner;
        // var winner_idx = accounts.indexOf(winner);
        var winner_idx = accounts.findIndex(item => winner.toLowerCase() == item.toLowerCase());
        lock.acquire(WINNER_DICT, () => {
            COUNTER_FINISHED ++;
            if (winner_idx in WINNER_DICT) {
                WINNER_DICT[winner_idx] += 1;
            } else {
                WINNER_DICT[winner_idx] = 1;
            }
        });
        if (log) {
            console.log("winner is " + (winner_idx + '').padStart('3', 0) + "th account: " + winner + ", winner prize is " + to_either(winner_prize) + ", benificiary prize is " + to_either(benificiary_prize));
        }
        // final output
        if (COUNTER_FINISHED >= BLOCKCOUNT * round) {
            // format
            var table_data = [['player', 'winning count', 'winning chance']];
            for (var k = 0; k < accounts.length; k ++) {
                idx = k + 1;
                table_data[idx] = [];
                table_data[idx].push(k);
                table_data[idx].push(k in WINNER_DICT ? WINNER_DICT[k] : 0);
                table_data[idx].push(k in WINNER_DICT ? WINNER_DICT[k] / COUNTER_FINISHED : 0);
            }
            var output = table.table(table_data);
            // console.log(table_data);
            console.log(output);
            callback();
            // web3.eth.clearSubscriptions().then(() => process.exit());
        }
    });
    // }).on('error', error => console.log);

    try {
        // await buy(inst, accounts, log);
        // await inst.lotteryEnd();
        function random(use_seed=false) {
            if (use_seed) {
                var x = Math.sin(SEED++) * 10000;
                return x - Math.floor(x);
            } else {
                return Math.random();
            }
        }
        function get_words32() {
            var words = '';
            for(var j = 0; j < WORD_LENGTH; j ++) {
                words += CHARACTERS.charAt(Math.floor((random() * CHARACTERS.length)));
            }
            return words;
        }
        // var lock_lottery = new AsyncLock();
        var done = 0;
        var acc2words = {};
        for (var i = 0; i < accounts.length; i++) {
            var buyer = accounts[i];
            var val = 5e17;
            var words = get_words32();
            var words32 = web3.utils.fromAscii(words, 32);
            // await inst.buy(words32, {from:buyer, value:val});
            sleep.msleep(50);
            inst.buy(words32, {from:buyer, value:val}).then((response) => {
                // var byer = response.receipt.from;
                lock.acquire(done, () => {
                    done ++;
                });
                if (done == accounts.length) {
                    inst.lotteryEnd();
                }
            });
            if (log) {
                // k = accounts.indexOf(byer);
                k = accounts.findIndex(item => buyer.toLowerCase() == item.toLowerCase());
                // console.log((k + '').padStart('3', 0) + "th buyer: " + buyer + "; val: " + to_either(val) + " ether; words: " + words);
                console.log('[' + (COUNTER++ + '').padStart('3', 0) + '] ' + (k + '').padStart('3', 0) + "th buyer: " + buyer + "; val: " + to_either(val) + " ether; words: " + words);
            }

        }
    }
    catch(e) {
        console.log(e)
    }

    return inst;
}


function to_either(wei) {
    return web3.utils.fromWei(String(wei), "ether");
}