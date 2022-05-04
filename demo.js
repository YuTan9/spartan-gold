"use strict";
const Blockchain = require('./blockchain.js');
const FakeNet  = require('./fake-net.js');

const Block = require('./block.js');
const Client = require('./client.js');
const Miner = require('./miner.js');
const Transaction = require('./transaction.js');
const debug = true;

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
let client_balance = [10000, 10000, 50000];
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

setTimeout(() => {
  let target = bob;
  let name = target.name;
  let addr = target.createAddress();
  try {
    alice.postTransaction([{amount: 100, address: addr}]);
    let time = new Date().toLocaleTimeString();
    record += `[${time}]: Alice \x1b[32mposted\x1b[0m transaction of 100 to ${name}\n`;
    client_balance[0] -= 101;
    client_balance[1] += 100;
  } catch (error) {
    let time = new Date().toLocaleTimeString();
    record += `[${time}]: Alice \x1b[32mfailed\x1b[0mtransaction of 100 to ${name}\n           ${error}\n`;
  }
}, 1000);

setTimeout(() => {
  let target = charlie;
  let name = target.name;
  let addr = target.createAddress();
  try {
    bob.postTransaction([{amount: 100, address: addr}]);
    let time = new Date().toLocaleTimeString();
    record += `[${time}]: Bob \x1b[32mposted\x1b[0mtransaction of 100 to ${name}\n`;
    client_balance[1] -= 101;
    client_balance[2] += 100;
  } catch (error) {
    let time = new Date().toLocaleTimeString();
    record += `[${time}]: Bob \x1b[32mfailed\x1b[0mtransaction of 100 to ${name}\n           ${error}\n`;
  }
}, 3000);

setTimeout(() => {
  let target = mickey;
  let name = target.name;
  let addr = target.createAddress();
  try {
    charlie.postTransaction([{amount: 100, address: addr}]);
    let time = new Date().toLocaleTimeString();
    record += `[${time}]: Charlie \x1b[32mposted\x1b[0mtransaction of 100 to ${name}\n`;
    client_balance[2] -= 101;
  } catch (error) {
    let time = new Date().toLocaleTimeString();
    record += `[${time}]: Charlie \x1b[32mfailed\x1b[0mtransaction of 100 to ${name}\n           ${error}\n`;
  }
  target = minnie;
  name = target.name;
  addr = target.createAddress();
  try {
    mickey.postTransaction([{amount: 100, address: addr}]);
    let time = new Date().toLocaleTimeString();
    record += `[${time}]: Mickey \x1b[32mposted\x1b[0mtransaction of 100 to ${name}\n`;
  } catch (error) {
    let time = new Date().toLocaleTimeString();
    record += `[${time}]: Mickey \x1b[32mfailed\x1b[0mtransaction of 100 to ${name}\n           ${error}\n`;
  }
}, 5000);

setTimeout(() => {
  let target = alice;
  let name = target.name;
  let addr = target.createAddress();
  try {
    minnie.postTransaction([{amount: 100, address: addr}]);
    let time = new Date().toLocaleTimeString();
    record += `[${time}]: Minnie \x1b[32mposted\x1b[0mtransaction of 100 to ${name}\n`;
    client_balance[0] += 100;
  } catch (error) {
    let time = new Date().toLocaleTimeString();
    record += `[${time}]: Minnie \x1b[32mfailed\x1b[0mtransaction of 100 to ${name}\n           ${error}\n`;
  }
}, 7000);


setTimeout(()=>{
  alice.lastConfirmedBlock.printBlockChain([alice, bob, charlie, mickey, minnie]);
  fakeNet.clients.forEach(client =>{client.cleanWallet(debug);});
  console.log();
  console.log(`Alice's balance is ${alice.availableGold}. (${alice.availableGold === client_balance[0]? '\x1b[32mmatches\x1b[0m': '\x1b[32mposted\x1b[0m'} with the expected balance ${client_balance[0]})`);
  console.log(`Bob's balance is ${bob.availableGold}. (${bob.availableGold === client_balance[1]? '\x1b[32mmatches\x1b[0m': '\x1b[31mdiffers\x1b[0m'} with the expected balance ${client_balance[1]})`);
  console.log(`Charlie's balance is ${charlie.availableGold}. (${charlie.availableGold === client_balance[2]? '\x1b[32mmatches\x1b[0m': '\x1b[31mdiffers\x1b[0m'} with the expected balance ${client_balance[2]})`);
  console.log(`Minnie's balance is ${minnie.availableGold}.`);
  console.log(`Mickey's balance is ${mickey.availableGold}.`);
  console.log();
  console.log(record);
  let endTime = alice.lastConfirmedBlock.timestamp;
  console.log(`Executed for ${(endTime - startTime) / 1000} seconds.`);
  console.log(`Produced ${alice.lastConfirmedBlock.chainLength} blocks.`);
  process.exit(0);
}, 15000);
