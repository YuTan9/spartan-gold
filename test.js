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
// let tree = new Tree();
// let transactions = ['a', 'b', 'c', 'd', 'e'];
// transactions.forEach(trx =>{
//   tree.addTransaction({id: trx});
// });
// tree.printTree();
// console.log(tree.getAllLeaves());
// // console.log(tree.root.data === tree.addHash({left: tree.root.left, right: tree.root.right}));
// console.log(tree.verifyTree());
function showBalances() {
  console.log();
  console.log(`Alice's balance is ${alice.availableGold}.`);
  alice.showAllUtxos();

  console.log();
  console.log(`Bob's balance is ${bob.availableGold}.`);
  bob.showAllUtxos();

  console.log();
  console.log(`Charlie's balance is ${charlie.availableGold}.`);
  charlie.showAllUtxos();

  console.log();
  console.log(`Minnie's balance is ${minnie.availableGold}.`);
  minnie.showAllUtxos();

  console.log();
  console.log(`Mickey's balance is ${mickey.availableGold}.`);
  mickey.showAllUtxos();
}

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
function randAddr(user){
  // let addrA = alice.createAddress();
  // let addrB = bob.createAddress();
  // let addrC = charlie.createAddress();
  // let addrMk = mickey.createAddress();
  // let addrMn = minnie.createAddress();
  let clients = [];
  fakeNet.clients.forEach(client=>{
    if(client !== user){
      clients.push(client);
    }
  });
  let selected = Math.floor(Math.random() * clients.length);
  return [clients[selected].createAddress(), clients[selected].name];
}

let record = "";


const interval = setInterval(() =>{
  let [target, name] = randAddr(alice);
  if(Math.random() < 0.5){
    try {
      alice.postTransaction([{amount: 100, address: target}]);
      let time = new Date().toLocaleTimeString();
      record += `[${time}]: alice posted transaction of 100 to ${name}\n`;
    } catch (error) {
      let time = new Date().toLocaleTimeString();
      record += `[${time}]: alice posted transaction of 100 to ${name}\n`;
    }
  }
  if(Math.random() < 0.5){
    let [target, name] = randAddr(bob);
    try {
      bob.postTransaction([{amount: 100, address: target}]);
      let time = new Date().toLocaleTimeString();
      record += `[${time}]: bob posted transaction of 100 to ${name}\n`;
    } catch (error) {
      let time = new Date().toLocaleTimeString();
      record += `[${time}]: bob failed transaction of 100 to ${name}\n`;
    }
  }
  if(Math.random() < 0.5){
    let [target, name] = randAddr(charlie);
    try {
      charlie.postTransaction([{amount: 100, address: target}]);
      let time = new Date().toLocaleTimeString();
      record += `[${time}]: charlie posted transaction of 100 to ${name}\n`;
    } catch (error) {
      let time = new Date().toLocaleTimeString();
      record += `[${time}]: charlie failed transaction of 100 to ${name}\n`;
    }
  }
  if(Math.random() < 0.5){
    let [target, name] = randAddr(mickey);
    try {
      mickey.postTransaction([{amount: 100, address: target}]);
      let time = new Date().toLocaleTimeString();
      record += `[${time}]: mickey posted transaction of 100 to ${name}\n`;
    } catch (error) {
      let time = new Date().toLocaleTimeString();
      record += `[${time}]: mickey failed transaction of 100 to ${name}\n`;
    }
  }
  if(Math.random() < 0.5){
    let [target, name] = randAddr(minnie);
    try {
      minnie.postTransaction([{amount: 100, address: target}]);
      let time = new Date().toLocaleTimeString();
      record += `[${time}]: minnie posted transaction of 100 to ${name}\n`;
    } catch (error) {
      let time = new Date().toLocaleTimeString();
      record += `[${time}]: minnie failed transaction of 100 to ${name}\n`;
    }
  }
}, 1000);

// Stop posting trx, set some time for the transactions to go thru
// or else some trx would be in progress causing the final balance outputing negitive values 
// (transaction posted, therefore balance was deducted, but the change was still pending)
setTimeout(() => {
  clearInterval(interval);
}, 6000);

setTimeout(()=>{
  fakeNet.clients.forEach(client =>{client.cleanWallet(debug);});
  showBalances();
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
