"use strict";
const Blockchain = require('./blockchain.js');
const FakeNet  = require('./fake-net.js');

const Block = require('./block.js');
const Client = require('./client.js');
const Miner = require('./miner.js');
const Transaction = require('./transaction.js');
const utils = require('./utils.js');


const Tree = require('./merkle-tree.js');
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
mickey.log = function(){};
minnie.log = function(){};
// Creating genesis block
let genesis = Blockchain.makeGenesis({
  blockClass: Block,
  transactionClass: Transaction,
  clientBalanceMap: new Map([
    [alice,   100000],
    [bob,     10000],
    [charlie, 50000],
    [minnie,  200],
    [mickey,  200],
  ]),
});


// Showing the initial balances from Alice's perspective, for no particular reason.
// console.log("Initial balances:");
// showBalances();

fakeNet.register(alice, bob, charlie, minnie, mickey);

minnie.initialize();
mickey.initialize();

let addr = bob.createAddress();
let addrA = alice.createAddress();
let addrC = charlie.createAddress();

setTimeout(()=>{}, 3000);

// Alice transfers some money to Bob.
setTimeout(() => {
  alice.postTransaction([{ amount: 100, address: addr }], 10);
  mickey.postTransaction([{ amount: 3, address: addr }]);
  mickey.postTransaction([{ amount: 3, address: addrA }]);
  mickey.postTransaction([{ amount: 3, address: addrC }]);
  mickey.postTransaction([{ amount: 3, address: addr }]);
  mickey.postTransaction([{ amount: 3, address: addrA }]);
  mickey.postTransaction([{ amount: 3, address: addrC }]);
  minnie.postTransaction([{ amount: 3, address: addr }]);
  minnie.postTransaction([{ amount: 3, address: addrA }]);
  minnie.postTransaction([{ amount: 3, address: addrC }]);
  minnie.postTransaction([{ amount: 3, address: addr }]);
  minnie.postTransaction([{ amount: 3, address: addrA }]);
  minnie.postTransaction([{ amount: 3, address: addrC }]);
}, 6000);

// setTimeout(() => {
//   showBalances();
//   addr = bob.createAddress();
//   addrA = alice.createAddress();
//   addrC = charlie.createAddress();
//   alice.postTransaction([{ amount: 100, address: addr }]);
//   mickey.postTransaction([{ amount: 3, address: addr }]);
//   mickey.postTransaction([{ amount: 3, address: addrA }]);
//   mickey.postTransaction([{ amount: 3, address: addrC }]);
// }, 20000);


// setTimeout(() => {
//   showBalances();
//   addr = bob.createAddress();
//   addrA = alice.createAddress();
//   addrC = charlie.createAddress();
//   alice.postTransaction([{ amount: 100, address: addr }]);
//   mickey.postTransaction([{ amount: 3, address: addr }]);
//   mickey.postTransaction([{ amount: 3, address: addrA }]);
//   mickey.postTransaction([{ amount: 3, address: addrC }]);
// }, 30000);


setTimeout(() => {
  // console.log(mickey.transactions);
  // console.log(minnie.transactions);
  // console.log(alice.availableGold);
  showBalances();
  // alice.blocks.forEach(b=>{
  //   console.log(utils.approxSize(b));
  //   // b.transactions.getAllLeaves().forEach(leaf=>{console.log(leaf);});
  // });
  // console.log(mickey.transactions.size === 0);
  // console.log(minnie.transactions.size === 0);
  // console.log(alice.lastConfirmedBlock.transactions);
  // console.log(mickey.lastConfirmedBlock.transactions);
  // mickey.showBlockchain();
  // alice.showBlockchain();
  // mickey.showAllBalances();
  // alice.log(alice.lastConfirmedBlock.id);
  // mickey.blocks.forEach(o=>{
  //   console.log(o.transactions);
  //   // if(o.prevBlockHash === alice.lastConfirmedBlock.id){
  //   //   console.log(o);
  //   // }
  // });
  // minnie.blocks.forEach(o=>{
  //   console.log(o.transactions);
  //   // if(o.prevBlockHash === alice.lastConfirmedBlock.id){
  //   //   console.log(o);
  //   // }
  // });
  // console.log(alice.wallet);
  process.exit(0);
}, 9000);
