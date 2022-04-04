"use strict";

const Blockchain = require('./blockchain.js');
const utils = require('./utils.js');
/**
 * Mixes in shared behavior between clients and miners for handling UTXO transactions.
 */
module.exports = {

  /**
   * In the UTXO model, a client should have a collection of addresses.
   * We refer to this collection as a "wallet".
   * 
   * In our design, the wallet will be a queue of addresses (first-in, first-out).
   * We represent this with an array.
   */
  setupWallet: function() {
    // A wallet has utxos of the form { address, keyPair }
    this.wallet = [];

    // Adding initial balance to wallet.
    this.wallet.push({ address: this.address, keyPair: this.keyPair });
  },

  /**
   * With the UTXO model, we must sum up all balances associated with
   * addresses in the wallet.
   */
  getConfirmedBalance: function() {
    // Go through all addresses and get the balances according to
    // the last confirmed block, then return the total.

    //
    // **YOUR CODE HERE**
    //
    let balance = 0;
    this.lastConfirmedBlock.balances.forEach((amount, address) =>{
      this.wallet.forEach(item =>{
        if(address === item.address){
          balance += amount;
        }
      });
    });
    return balance;
  },

  /**
   * Creates a new address/keypair combo and adds it to the wallet.
   * 
   * @returns Newly created address.
   */
  createAddress: function() {
    // Create a new keypair, derive the address from the public key,
    // add these details to the wallet, and return the address.

    //
    // **YOUR CODE HERE**
    //
    let newKey = utils.generateKeypair();
    let newAddress = utils.calcAddress(newKey.public);
    this.wallet.push({address: newAddress, keyPair: newKey});
    return newAddress;
  },

  /**
   * Utility method that prints out a table of all UTXOs.
   * (That is, the amount of gold for all addresses that
   * have not yet been spent.)
   * 
   * This table also includes a "**TOTAL**" entry at the end
   * summing up the total amount of UTXOs.
   */
  showAllUtxos: function() {
    let table = [];
    this.wallet.forEach(({ address }) => {
      let amount = this.lastConfirmedBlock.balanceOf(address);
      table.push({ address: address, amount: amount });
    });
    table.push({ address: "***TOTAL***", amount: this.confirmedBalance });
    console.table(table);
  },

  /**
   * Broadcasts a transaction from the client giving gold to the clients
   * specified in 'outputs'. A transaction fee may be specified, which can
   * be more or less than the default value.
   * 
   * The method gathers sufficient UTXOs, starting with the oldest addresses
   * in the wallet.  If the amount of gold exceeds the amount needed, a
   * new "change address" is created, which will receive any additional coins.
   * 
   * @param {Array} outputs - The list of outputs of other addresses and
   *    amounts to pay.
   * @param {number} [fee] - The transaction fee reward to pay the miner.
   * 
   * @returns {Transaction} - The posted transaction.
   */
  postTransaction: function(outputs, fee=Blockchain.DEFAULT_TX_FEE) {

    // Calculate the total value of gold needed and make sure the client has sufficient gold.
    //
    // If they do, gather up UTXOs from the wallet (starting with the oldest) until the total
    // value of the UTXOs meets or exceeds the gold required.
    //
    // Determine by how much the collected UTXOs exceed the total needed.
    // Create a new address to receive this "change" and add it to the list of outputs.
    //
    // Call `Blockchain.makeTransaction`, noting that 'from' and 'pubKey' are arrays
    // instead of single values.  The nonce field is not needed, so set it to '0'.
    //
    // Once the transaction is created, sign it with all private keys for the UTXOs used.
    // The order that you call the 'sign' method must match the order of the from and pubKey fields.

    let totalGoldNeeded = 0;
    outputs.forEach(({amount, address})=>{
      totalGoldNeeded += amount;
    });
    totalGoldNeeded += fee;
    if(this.availableGold < totalGoldNeeded){
      throw new Error(`${this.name} doesn't have enough gold.`);
    }
    let gathered_gold = 0;
    let gathered_utxo = [];
    let pubKeys = [];
    let privKeys = [];
    for(let [address, amount] of this.lastConfirmedBlock.balances){
      for(let o of this.wallet){
        let [wallet_address, wallet_keypair] = [o.address, o.keyPair];
        if(address === wallet_address){
          gathered_gold += amount;
          gathered_utxo.push(address);
          pubKeys.push(wallet_keypair.public);
          privKeys.push(wallet_keypair.private);
        }
        if(gathered_gold >= totalGoldNeeded) break;
      }
      if(gathered_gold >= totalGoldNeeded) break;
    }

    if(gathered_gold > totalGoldNeeded){
      // console.log(`***Need to make ${gathered_gold-totalGoldNeeded} change, with ${gathered_gold} in and ${totalGoldNeeded} out.\n`);
      let newAddress = this.createAddress();
      outputs.push({amount: gathered_gold-totalGoldNeeded, address: newAddress});
    }
    // 
    // console.log(gathered_gold);
    let tx = Blockchain.makeTransaction({from: gathered_utxo, nonce: 0, pubKey: pubKeys, outputs: outputs, fee: fee});
    privKeys.forEach(priv=>{
      tx.sign(priv);
      this.wallet.shift();
    });
    // Adding transaction to pending.
    this.pendingOutgoingTransactions.set(tx.id, tx);

    this.net.broadcast(Blockchain.POST_TRANSACTION, tx);

    // If the client is a miner, add the transaction to the current block.
    if (this.addTransaction !== undefined) {
      this.addTransaction(tx, this);
    }

    return tx;
  },
}
