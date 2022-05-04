"use strict";

let Blockchain = require('./blockchain.js');
let Client = require('./client.js');
let MerkleTree = require('./merkle-tree.js');
const UtxoMixin = require("./utxo-mixin.js");
const utils = require('./utils.js');

/**
 * Miners are clients, but they also mine blocks looking for "proofs".
 */
module.exports = class Miner extends Client {

  /**
   * When a new miner is created, but the PoW search is **not** yet started.
   * The initialize method kicks things off.
   * 
   * @constructor
   * @param {Object} obj - The properties of the client.
   * @param {String} [obj.name] - The miner's name, used for debugging messages.
   * * @param {Object} net - The network that the miner will use
   *      to send messages to all other clients.
   * @param {Block} [startingBlock] - The most recently ALREADY ACCEPTED block.
   * @param {Object} [obj.keyPair] - The public private keypair for the client.
   * @param {Number} [miningRounds] - The number of rounds a miner mines before checking
   *      for messages.  (In single-threaded mode with FakeNet, this parameter can
   *      simulate miners with more or less mining power.)
   */
  constructor({name, net, startingBlock, keyPair, miningRounds=Blockchain.NUM_ROUNDS_MINING} = {}) {
    super({name, net, startingBlock, keyPair});
    this.miningRounds=miningRounds;

    // Set of transactions to be added to the next block.
    this.transactions = new Set();
    // For miners, this.transactions doesn't need to be a merkle tree, coz it is just for memorizing which trx should be added to next block
    // where the trx were stored in merkle trees in blocks

    Object.assign(this, UtxoMixin);

    this.setupWallet();
  }

  /**
   * Starts listeners and begins mining.
   */
  initialize() {
    this.startNewSearch();

    this.on(Blockchain.START_MINING, this.findProof);
    this.on(Blockchain.POST_TRANSACTION, this.addTransaction);
    this.on(Blockchain.UPDATE_DIFFICULTY, this.updateDifficulty);
    setTimeout(() => this.emit(Blockchain.START_MINING), 0);
  }
  
  updateDifficulty({now: now}){
    this.log('+------------------------------------+');
    this.log('| miner initialize update difficulty |');
    this.log('+------------------------------------+');
    let lastUpdated = this.currentBlock;
    // console.log(lastUpdated);
    while(now - lastUpdated.timestamp < Blockchain.TIME_BETWEEN_UPDATES && !lastUpdated.isGenesisBlock()){
      lastUpdated = this.blocks.get(lastUpdated.prevBlockHash);
    }
    this.log(`Current height: ${this.currentBlock.chainLength - 1}`);  // the current block is still searching for proof so not considered as a mined block
    this.log(`Last updated height: ${lastUpdated.chainLength}`);
    let num_blocks = this.currentBlock.chainLength - lastUpdated.chainLength - 1;
    if (num_blocks*2 < Blockchain.BLOCKS_BETWEEN_UPDATES){
      let current_difficulty = Blockchain.cfg.powLeadingZeroes;
      let diff_holder = current_difficulty;
      while(num_blocks < Blockchain.BLOCKS_BETWEEN_UPDATES && current_difficulty > 0){
        current_difficulty -= 1;
        num_blocks *= 2;
      }
      this.log(`\x1b[31mDecreased difficulty from ${diff_holder} to ${current_difficulty}\x1b[0m`);
      Blockchain.updateDifficulty(current_difficulty, now);
    }else if(num_blocks/2 > Blockchain.BLOCKS_BETWEEN_UPDATES){
      let current_difficulty = Blockchain.cfg.powLeadingZeroes;
      let diff_holder = current_difficulty;
      while(num_blocks/2 > Blockchain.BLOCKS_BETWEEN_UPDATES && current_difficulty < 64 * 4){
        current_difficulty += 1;
        num_blocks /= 2;
      }
      this.log(`\x1b[31mIncreased difficulty from ${diff_holder} to ${current_difficulty}\x1b[0m`);
      Blockchain.updateDifficulty(current_difficulty, now);
    }else{
      this.log("\x1b[33mNo difficulty update required!\x1b[0m");
    }
  }

  activateDebug(){
    this.debug = true;
  }
  
  /**
   * Gets balance of miner from last confirmed block,
   * not counting any pending ingoing or outgoing transactions.
   * 
   * @returns {number} -- Total available gold as of the last confirmed block.
   */
  get confirmedBalance() {
    return this.getConfirmedBalance();
  }


  /**
   * Returns false if transaction is not accepted. Otherwise stores
   * the transaction to be added to the next block.
   * 
   * @param {Transaction | String} tx - The transaction to add.
   */
   addTransaction(tx) {
    tx = Blockchain.makeTransaction(tx);
    this.transactions.add(tx);
  }
  
  /**
   * Sets up the miner to start searching for a new block.
   * 
   * @param {Set} [txSet] - Transactions the miner has that have not been accepted yet.
   */
  startNewSearch(txSet=new Set()) {
    if(this.lastBlock.rewardAddr === this.address){ 
      let old_addr = this.address;
      this.address = this.createAddress();
      this.net.updateClientAddress(old_addr, this);
    }else if(this.lastBlock.balances.get(this.address) || 0 > 0){
      let old_addr = this.address;
      this.address = this.createAddress();
      this.net.updateClientAddress(old_addr, this);
    }
    
    let tmpBlock = Blockchain.makeBlock(this.address, this.lastBlock);

    // Merging txSet into the transaction queue.
    // These transactions may include transactions not already included
    // by a recently received block, but that the miner is aware of.
    txSet.forEach((tx) => this.transactions.add(tx));

    // Add queued-up transactions to block.
    this.transactions.forEach((tx) => {
      tmpBlock.addTransaction(tx, this);
    });
    if(utils.approxSize(tmpBlock) > Blockchain.BLOCKSIZE){
      if(this.transactions.size > 0){
        this.log('+---------------------+');
        this.log('| \x1b[32mBLOCKSIZE exceeded.\x1b[0m |');
        this.log('+---------------------+');
        this.log(`\tTransactions: ${this.transactions.size}`);
      }
      let sortedTrx= [];
      this.transactions.forEach((tx)=>{
        let i = 0;
        for(;i<sortedTrx.length; i++){
          if(sortedTrx[i].fee < tx.fee){break;}
        }
        if(sortedTrx.length > 0){
          if(sortedTrx[sortedTrx.length - 1].fee > tx.fee){i++;}
        }
        sortedTrx.splice(i, 0, tx);
      });
      let counter = 0;
      tmpBlock = Blockchain.makeBlock(this.address, this.lastBlock);
      while(utils.approxSize(tmpBlock) < Blockchain.BLOCKSIZE && counter < sortedTrx.length){
        tmpBlock.addTransaction(sortedTrx[counter], this);
        counter ++;
      }
      if(this.transactions.size > 0){
        this.log(`\tSplit at ${counter}`);
      }
      let inLaterBlocks = sortedTrx.slice(counter);
      this.currentBlock = Blockchain.makeBlock(this.address, this.lastBlock);
      sortedTrx.slice(0, counter).forEach(tx=>{
        this.currentBlock.addTransaction(tx, this);
        this.log(`\tOne transaction added to main block`);
      });
      this.transactions.clear();
      inLaterBlocks.forEach((tx) => this.transactions.add(tx));
      if(this.transactions.size > 0){
        this.log(`\tthis.transactions.size: ${this.transactions.size}`);
      }
      this.currentBlock.proof = 0;
      // this.transactions.forEach(tx => console.log(tx));
      // setTimeout(this.startNewSearch(), 1000);
    }else{
      this.currentBlock = Blockchain.makeBlock(this.address, this.lastBlock);
      this.transactions.forEach((tx) => {
        this.currentBlock.addTransaction(tx, this);
      });
      this.transactions.clear();
      this.currentBlock.proof = 0;
    }
    // this.transactions.clear();
    // Start looking for a proof at 0.
  }

  /**
   * Looks for a "proof".  It breaks after some time to listen for messages.  (We need
   * to do this since JS does not support concurrency).
   * 
   * The 'oneAndDone' field is used for testing only; it prevents the findProof method
   * from looking for the proof again after the first attempt.
   * 
   * @param {boolean} oneAndDone - Give up after the first PoW search (testing only).
   */
  findProof(oneAndDone=false) {
    let pausePoint = this.currentBlock.proof + this.miningRounds;
    while (this.currentBlock.proof < pausePoint) {
      if (this.currentBlock.hasValidProof()) {
        // this.log(`found proof for block ${this.currentBlock.chainLength}: ${this.currentBlock.proof}`);
        // console.log(`Found proof for block ${this.currentBlock.chainLength} with size ${utils.approxSize(this.currentBlock)}`);
        // console.log(this.currentBlock);
        this.announceProof();
        // Note: calling receiveBlock triggers a new search.
        this.receiveBlock(this.currentBlock);
        break;
      }
      this.currentBlock.proof++;
    }
    // If we are testing, don't continue the search.
    if (!oneAndDone) {
      // Check if anyone has found a block, and then return to mining.
      setTimeout(() => this.emit(Blockchain.START_MINING), 0);
    }
  }

  /**
   * Broadcast the block, with a valid proof included.
   */
  announceProof() {
    this.net.broadcast(Blockchain.PROOF_FOUND, this.currentBlock);
  }

  /**
   * Receives a block from another miner. If it is valid,
   * the block will be stored. If it is also a longer chain,
   * the miner will accept it and replace the currentBlock.
   * 
   * @param {Block | Object} b - The block
   */
  receiveBlock(s) {
    let b = super.receiveBlock(s);

    if (b === null) return null;

    // We switch over to the new chain only if it is better.
    if (this.currentBlock && b.chainLength >= this.currentBlock.chainLength) {
      // this.log(`cutting over to new chain.`);
      let txSet = this.syncTransactions(b);
      this.startNewSearch(txSet);
    }

    return b;
  }

  /**
   * This function should determine what transactions
   * need to be added or deleted.  It should find a common ancestor (retrieving
   * any transactions from the rolled-back blocks), remove any transactions
   * already included in the newly accepted blocks, and add any remaining
   * transactions to the new block.
   * 
   * @param {Block} nb - The newly accepted block.
   * 
   * @returns {Set} - The set of transactions that have not yet been accepted by the new block.
   */
  syncTransactions(nb) {
    let cb = this.currentBlock;
    let cbTxs = new Set();
    let nbTxs = new Set();

    // The new block may be ahead of the old block.  We roll back the new chain
    // to the matching height, collecting any transactions.
    while (nb.chainLength > cb.chainLength) {
      nb.transactions.getAllLeaves().forEach((tx) => nbTxs.add(tx));
      nb = this.blocks.get(nb.prevBlockHash);
    }

    // Step back in sync until we hit the common ancestor.
    while (cb && cb.id !== nb.id) {
      // Store any transactions in the two chains.
      cb.transactions.getAllLeaves().forEach((tx) => cbTxs.add(tx));
      nb.transactions.getAllLeaves().forEach((tx) => nbTxs.add(tx));

      cb = this.blocks.get(cb.prevBlockHash);
      nb = this.blocks.get(nb.prevBlockHash);
    }

    // Remove all transactions that the new chain already has.
    nbTxs.forEach((tx) => cbTxs.delete(tx));

    return cbTxs;
  }

  /**
   * When a miner posts a transaction, it must also add it to its current list of transactions.
   *
   * @param  {...any} args - Arguments needed for Client.postTransaction.
   */
  postTransaction(...args) {
    let tx = super.postTransaction(...args);
    return this.addTransaction(tx);
  }

};
