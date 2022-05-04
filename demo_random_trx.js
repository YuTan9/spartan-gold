"use strict";
const Blockchain = require('./blockchain.js');
const FakeNet  = require('./fake-net.js');

const Block = require('./block.js');
const Client = require('./client.js');
const Miner = require('./miner.js');
const Transaction = require('./transaction.js');
const debug = false;

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
function randAddr(clients){
  let selected = Math.floor(Math.random() * clients.length);
  return [clients[selected].createAddress(), clients[selected].name];
}

let record = "";


const interval = setInterval(() =>{
  if(Math.random() < 0.5){
    let [target, name] = randAddr([bob, charlie, minnie, mickey]);
    try {
      alice.postTransaction([{amount: 100, address: target}]);
      let time = new Date().toLocaleTimeString();
      record += `[${time}]: alice posted transaction of 100 to ${name}\n`;
      client_balance[0] -= 101;
      switch(name){
        case 'Bob':
          client_balance[1] += 100;
          break;
        case 'Charlie':
          client_balance[2] += 100;
          break;
      }
    } catch (error) {
      let time = new Date().toLocaleTimeString();
      record += `[${time}]: alice failed transaction of 100 to ${name}\n           ${error}\n`;
    }
  }
  if(Math.random() < 0.5){
    let [target, name] = randAddr([alice, charlie, minnie, mickey]);
    try {
      bob.postTransaction([{amount: 100, address: target}]);
      let time = new Date().toLocaleTimeString();
      record += `[${time}]: bob posted transaction of 100 to ${name}\n`;
      client_balance[1] -= 101;
      switch(name){
        case 'Alice':
          client_balance[0] += 100;
          break;
        case 'Charlie':
          client_balance[2] += 100;
          break;
      }
    } catch (error) {
      let time = new Date().toLocaleTimeString();
      record += `[${time}]: bob failed transaction of 100 to ${name}\n           ${error}\n`;
    }
  }
  if(Math.random() < 0.5){
    let [target, name] = randAddr([alice, bob, minnie, mickey]);
    try {
      charlie.postTransaction([{amount: 100, address: target}]);
      let time = new Date().toLocaleTimeString();
      record += `[${time}]: charlie posted transaction of 100 to ${name}\n`;
      client_balance[2] -= 101;
      switch(name){
        case 'Bob':
          client_balance[1] += 100;
          break;
        case 'Alice':
          client_balance[0] += 100;
          break;
      }
    } catch (error) {
      let time = new Date().toLocaleTimeString();
      record += `[${time}]: charlie failed transaction of 100 to ${name}\n           ${error}\n`;
    }
  }
  if(Math.random() < 0.5){
    let [target, name] = randAddr([alice, bob, charlie, minnie]);
    try {
      mickey.postTransaction([{amount: 100, address: target}]);
      let time = new Date().toLocaleTimeString();
      record += `[${time}]: mickey posted transaction of 100 to ${name}\n`;
      switch(name){
        case 'Bob':
          client_balance[1] += 100;
          break;
        case 'Alice':
          client_balance[0] += 100;
          break;
        case 'Charlie':
          client_balance[2] += 100;
          break;
      }
    } catch (error) {
      let time = new Date().toLocaleTimeString();
      record += `[${time}]: mickey failed transaction of 100 to ${name}\n           ${error}\n`;
    }
  }
  if(Math.random() < 0.5){
    let [target, name] = randAddr([alice, bob, charlie, mickey]);
    try {
      minnie.postTransaction([{amount: 100, address: target}]);
      let time = new Date().toLocaleTimeString();
      record += `[${time}]: minnie posted transaction of 100 to ${name}\n`;
      switch(name){
        case 'Bob':
          client_balance[1] += 100;
          break;
        case 'Alice':
          client_balance[0] += 100;
          break;
        case 'Charlie':
          client_balance[2] += 100;
          break;
      }
    } catch (error) {
      let time = new Date().toLocaleTimeString();
      record += `[${time}]: minnie failed transaction of 100 to ${name}\n           ${error}\n`;
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
  alice.lastConfirmedBlock.printBlockChain([alice, bob, charlie, mickey, minnie]);
  fakeNet.clients.forEach(client =>{client.cleanWallet(debug);});
  console.log();
  console.log(`Alice's balance is ${alice.availableGold}. (${alice.availableGold === client_balance[0]? '\x1b[32mmatches\x1b[0m': '\x1b[31mdiffers\x1b[0m'} with the expected balance ${client_balance[0]})`);
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
