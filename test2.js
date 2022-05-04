"use strict";
const Blockchain = require('./blockchain.js');
const FakeNet  = require('./fake-net.js');

const Block = require('./block.js');
const Client = require('./client.js');
const Miner = require('./miner.js');
const Transaction = require('./transaction.js');
const utils = require('./utils.js');
const debug = false;

const Tree = require('./merkle-tree.js');
const { EventEmitter } = require('./client.js');

let fakeNet = new FakeNet();

// Clients
let alice = new Client({name: "Alice", net: fakeNet});
let bob = new Client({name: "Bob", net: fakeNet});
let charlie = new Client({name: "Charlie", net: fakeNet});

// Miners
let minnie = new Miner({name: "Minnie", net: fakeNet});
let mickey = new Miner({name: "Mickey", net: fakeNet});
if(!debug){
  alice.log = function(){};
  bob.log = function(){};
  charlie.log = function(){};
  mickey.log = function(){};
  minnie.log = function(){};
}
// Creating genesis block
let genesis = Blockchain.makeGenesis({
  blockClass: Block,
  transactionClass: Transaction,
  clientBalanceMap: new Map([
    [alice,   10000],
    [bob,     10000],
    [charlie, 50000],
    [minnie,  200],
    [mickey,  200],
  ]),
});
let startTime = genesis.timestamp;

// Showing the initial balances from Alice's perspective, for no particular reason.
// console.log("Initial balances:");
// showBalances();

fakeNet.register(alice, bob, charlie, minnie, mickey);

minnie.initialize();
mickey.initialize();
if(debug){
  mickey.activateDebug();
  minnie.activateDebug();
}

let record = "";





setTimeout(() =>{
  let addr = bob.createAddress();
  let time = new Date().toLocaleTimeString();
  record += `[${time}]: alice posting transaction of 100 to ${addr}\n`;
  alice.postTransaction([{amount: 100, address: addr}]);
}, 1000);

setTimeout(() =>{
  let addr = charlie.createAddress();
  let time = new Date().toLocaleTimeString();
  record += `[${time}]: bob posting transaction of 100 to ${addr}\n`;
  bob.postTransaction([{amount: 100, address: addr}]);
}, 2000);

setTimeout(() =>{
  let addr = mickey.createAddress();
  let time = new Date().toLocaleTimeString();
  record += `[${time}]: charlie posting transaction of 100 to ${addr}\n`;
  charlie.postTransaction([{amount: 100, address: addr}]);
}, 3000);

setTimeout(() =>{
  let addr = minnie.createAddress();
  let time = new Date().toLocaleTimeString();
  record += `[${time}]: mickey posting transaction of 100 to ${addr}\n`;
  mickey.postTransaction([{amount: 100, address: addr}]);
}, 4000);

setTimeout(() =>{
  let addr = alice.createAddress();
  let time = new Date().toLocaleTimeString();
  record += `[${time}]: minnie posting transaction of 100 to ${addr}\n`;
  minnie.postTransaction([{amount: 100, address: addr}]);
}, 5000);

// Stop posting trx, set some time for the transactions to go thru
// or else some trx would be in progress causing the final balance outputing negitive values 
// (transaction posted, therefore balance was deducted, but the change was still pending)
// setTimeout(() => {
//   clearInterval(interval);
// }, 6000);

setTimeout(()=>{
  alice.lastConfirmedBlock.printBlockChain([alice, bob, charlie, mickey, minnie]);
  fakeNet.clients.forEach(client =>{client.cleanWallet(debug);});
  // showBalances();
  console.log(`Alice's balance is ${alice.availableGold}.`);
  console.log(`Bob's balance is ${bob.availableGold}.`);
  console.log(`Charlie's balance is ${charlie.availableGold}.`);
  console.log(`Minnie's balance is ${minnie.availableGold}.`);
  console.log(`Mickey's balance is ${mickey.availableGold}.`);
  console.log(record);
  let endTime = alice.lastConfirmedBlock.timestamp;
  console.log(`Executed for ${(endTime - startTime) / 1000} seconds.`);
  console.log(`Produced ${alice.lastConfirmedBlock.chainLength} blocks.`);
  process.exit(0);
}, 10000);
