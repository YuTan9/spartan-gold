"use strict";

const Blockchain = require('./blockchain.js');
const FakeNet  = require('./fake-net.js');

const Block = require('./block.js');
const Client = require('./client.js');
const Miner = require('./miner.js');
const Transaction = require('./transaction.js');

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
/**
 * In Part 2, we build the UTXO model.  Note that the Block, Client, Miner,
 * and Transaction classes have been overridden.
 * 
 * In this example, Alice gives some gold to Bob, who records that amount
 * of gold in a **new** address.  Once this transaction is complete,
 * Bob should have a total of 139 gold in two different UTXOs (one for 99,
 * another for the 40 he received from Alice).
 * 
 * Bob then uses both of those UTXOs pay Charlie 110 gold.
 * Since 139 > 110 + 1 (for the transaction fee), Bob must create a new
 * 'change address' to keep the balance of 28 coins.  At the end of the
 * simulation, Charlie should have 177 gold stored in two different addresses.
 */

console.log("Starting simulation.  This may take a moment...");

let fakeNet = new FakeNet();

// Clients
let alice = new Client({name: "Alice", net: fakeNet});
let bob = new Client({name: "Bob", net: fakeNet});
let charlie = new Client({name: "Charlie", net: fakeNet});

// Miners
let minnie = new Miner({name: "Minnie", net: fakeNet});
let mickey = new Miner({name: "Mickey", net: fakeNet});
// Creating genesis block
let genesis = Blockchain.makeGenesis({
  blockClass: Block,
  transactionClass: Transaction,
  clientBalanceMap: new Map([
    [alice, 233],
    [bob, 99],
    [charlie, 67],
    [minnie, 200],
    [mickey, 200],
  ]),
});


// Showing the initial balances from Alice's perspective, for no particular reason.
console.log("Initial balances:");
showBalances();

fakeNet.register(alice, bob, charlie, minnie, mickey);

// Miners start mining.
minnie.initialize();
mickey.initialize();

// Alice transfers some money to Bob.
let addr = bob.createAddress();
console.log();
console.log(`***Alice is transferring 40 gold to Bob at address ${addr}`);
console.log();
alice.postTransaction([{ amount: 40, address: addr }]);

setTimeout(() => {
  console.log();
  showBalances();
  // process.exit();
  let addr = charlie.createAddress();
  console.log();
  console.log(`***Bob is transferring 110 gold to Charlie at address ${addr}`);
  console.log();
  bob.postTransaction([{ amount: 110, address: addr }]);
}, 4000);

// Print out the final balances after it has been running for some time.
setTimeout(() => {
  console.log();
  showBalances();

  console.log();
  console.log("Showing all UTXOs, unorganized:");
  alice.showAllBalances();

  console.log();
  console.log(`Minnie's chain length is ${minnie.currentBlock.chainLength}.`);

  process.exit(0);
}, 9000);

