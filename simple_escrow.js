//Escrow Protocol Implementation

let Block = require('./block.js');
let Client = require('./client.js');
let Miner = require('./miner.js');

let utils = require('./utils.js');
let fakeNet = require('./fakeNet.js');


// Creating a genesis block and miners.
const GENESIS_BLOCK = new Block();

//Generating keypairs for Clients - Alice, Bob, Charlie & Esma
// Miners - Mike & Mini
let ak = utils.generateKeypair();
let bk = utils.generateKeypair();
let ck = utils.generateKeypair();
//Adding Esma - The Escrow
let em = utils.generateKeypair();
//Add miners
let mk = utils.generateKeypair();
let mn = utils.generateKeypair();


GENESIS_BLOCK.utxo[utils.calcId(ak.public)] = 133;
GENESIS_BLOCK.utxo[utils.calcId(bk.public)] = 49;
GENESIS_BLOCK.utxo[utils.calcId(ck.public)] = 16;
GENESIS_BLOCK.utxo[utils.calcId(mk.public)] = 4;
GENESIS_BLOCK.utxo[utils.calcId(mn.public)] = 12;
GENESIS_BLOCK.utxo[utils.calcId(em.public)] = 0;


let alice = new Client(fakeNet.broadcast, ak);
let bob = new Client(fakeNet.broadcast, bk);
let charlie = new Client(fakeNet.broadcast, ck);
let esma = new Client(fakeNet.broadcast, em);
let mike = new Miner(fakeNet.broadcast, mk, GENESIS_BLOCK);
let mini = new Miner(fakeNet.broadcast, mn, GENESIS_BLOCK);


fakeNet.registerMiner(mike);
fakeNet.registerMiner(mini);


// Makes transactions for transferring money between the three parties.
function transfer(sender, reciever, a, b) {
  let output = {};
  output[sender.keys.id] = a;
  output[reciever.keys.id] = b;
  sender.postTransaction(output);
}


console.log("Initial balances");
console.log(mike.currentBlock.utxo)
console.log(mini.currentBlock.utxo)


console.log("Beginning to mine");

mike.initialize()
mini.initialize()


transfer(alice, esma, 100, 33);
transfer(esma, bob, 1, 32);


// Print out the final balances after it has been running for some time.
setTimeout(() => {
  console.log(mike.currentBlock.utxo)
  console.log(mini.currentBlock.utxo)

}, 5000);
