"use strict";

const utils = require('./utils.js');

// String constants mixed in before hashing.
const TX_CONST = "TX";

/**
 * A transaction comes from a single account, specified by "address". For
 * each account, transactions have an order established by the nonce. A
 * transaction should not be accepted if the nonce has already been used.
 * (Nonces are in increasing order, so it is easy to determine when a nonce
 * has been used.)
 */
module.exports = class Transaction {

  /**
   * The constructor for a transaction includes an array of outputs, meaning
   * that one transaction can pay multiple parties. An output is a pair of an
   * amount of gold and the hash of a public key (also called the address),
   * in the form:
   *    {amount, address}
   * 
   * @constructor
   * @param {Object} obj - The inputs and outputs of the transaction.
   * @param obj.from - The address of the payer.
   * @param obj.nonce - Number that orders the payer's transactions.  For coinbase
   *          transactions, this should be the block height.
   * @param obj.pubKey - Public key associated with the specified from address.
   * @param obj.sig - Signature of the transaction.  This field may be omitted.
   * @param {Array} [obj.outputs] - An array of the outputs.
   * @param [obj.fee] - The amount of gold offered as a transaction fee.
   * @param [obj.data] - Object with any additional properties desired for the transaction.
   */
  constructor({from, nonce, pubKey, sig = [], outputs, fee=0, data={}}) {
    this.from = from;
    this.nonce = nonce;
    this.pubKey = pubKey;
    this.sig = sig;
    this.fee = fee;
    this.outputs = [];
    if (outputs) outputs.forEach(({amount, address}) => {
      if (typeof amount !== 'number') {
        amount = parseInt(amount, 10);
      }
      this.outputs.push({amount, address});
    });
    this.data = data;
  }

  /**
   * A transaction's ID is derived from its contents.
   */
  get id() {
    return utils.hash(TX_CONST + JSON.stringify({
      from: this.from,
      nonce: this.nonce,
      pubKey: this.pubKey,
      outputs: this.outputs,
      fee: this.fee,
      data: this.data }));
  }

  /**
   * Signs a transaction and stores the signature in the transaction.
   * 
   * @param privKey  - The key used to sign the signature.  It should match the
   *    public key included in the transaction.
   */
  sign(privKey) {
    this.sig.push(utils.sign(privKey, this.id));
  }

  /**
   * Determines whether the signatures of the transaction are valid
   * and if the from addresses match the corresponding public keys.
   * 
   * @returns {Boolean} - Validity of the signature and from address.
   */
   validSignature() {
    if(this.from.length === this.sig.length && this.sig.length === this.pubKey.length){
      for(let i = 0; i < this.from.length; i++){
        if(!utils.addressMatchesKey(this.from[i], this.pubKey[i])) return false;
        if(!this.sig[i]) return false;
        if(!utils.verifySignature(this.pubKey[i], this.id, this.sig[i])) return false;
      }
      return true;
    }else{
      return false;
    }
  }

  /**
   * Verifies that there is currently sufficient gold for the transaction.
   * 
   * @param {Block} block - Block used to check current balances
   * 
   * @returns {boolean} - True if there are sufficient funds for the transaction,
   *    according to the balances from the specified block.
   */
  sufficientFunds(block) {
    return this.totalOutput() <= this.totalInput(block);
  }

  /**
   * Sums up the total of the UTXOs used as input for this transaction,
   * according to the specified block.
   * 
   * @param {Block} block - Block used to look up UTXO balances.
   */
   totalInput(block) {
    // Look up the balance for all address in the 'from' field of 'this'.
    let res = 0;
    this.from.forEach((addr)=>{
      if(block.balances.has(addr)) res += block.balances.get(addr);
    });
    return res;
  }

  /**
   * Calculates the total value of all outputs, including the transaction fee.
   * 
   * @returns {Number} - Total amount of gold given out with this transaction.
   */
  totalOutput() {
    return this.outputs.reduce( (totalValue, {amount}) => totalValue + amount, this.fee);
  }
};
