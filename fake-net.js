"use strict";

const { useProxy } = require("chai/lib/chai/config");
let Blockchain = require("./blockchain");

/**
 * Simulates a network by using events to enable simpler testing.
 */
module.exports = class FakeNet {

  /**
   * Specifies a chance of a message failing to be sent and
   * the maximum delay of a message (in milliseconds) if it
   * is sent.
   * 
   * This version is designed to simulate more realistic network
   * conditions for testing.
   * 
   * The messageDelay parameter is the maximum -- a message may
   * be delayed any amount of time between 0 ms and the delay specified.
   * 
   * @param {number} [chanceMessageFails] - Should be in the range of 0 to 1.
   * @param {number} [messageDelay] - Time that a message may be delayed.
   */
  constructor(chanceMessageFails=0, messageDelay=0, now = Date.now()) {
    this.clients = new Map();
    this.chanceMessageFails = chanceMessageFails;
    this.messageDelayMax = messageDelay;
    this.startTime = now;
    
    setInterval(()=>{this.updateDifficulty();}, Blockchain.TIME_BETWEEN_UPDATES); // check if should update diff every second
    setInterval(()=>{this.debug();}, Blockchain.TIME_BETWEEN_UPDATES);
  }

  debug(){
    console.log(`***Current difficulty: ${Blockchain.cfg.powLeadingZeroes}***`);
  }
  updateDifficulty(){
    // console.log('+---------------------------------------+');
    // console.log('| fake-net initialize update difficulty |');
    // console.log('+---------------------------------------+');
    let now = Date.now();
    if(now - this.startTime >= Blockchain.TIME_BETWEEN_UPDATES){
      console.log('+---------------------------------------+');
      console.log('| fake-net initialize update difficulty |');
      console.log('+---------------------------------------+');
      this.startTime = now;
      this.broadcast(Blockchain.UPDATE_DIFFICULTY, {now: now});
    }
  }
  /**
   * Registers clients to the network.
   * Clients and Miners are registered by public key.
   *
   * @param {...Object} clientList - clients to be registered to this network (may be Client or Miner)
   */
  register(...clientList) {
    for (const client of clientList) {
      this.clients.set(client.address, client);
    }
  }

  updateClientAddress(oldAddress, client){
    console.log('update address');
    console.log(`from ${oldAddress} to ${client.address}`);
    this.clients.delete(oldAddress);
    this.register(client);
  }
  /**
   * Broadcasts to all clients within this.clients the message msg and payload o.
   *
   * @param {String} msg - the name of the event being broadcasted (e.g. "PROOF_FOUND")
   * @param {Object} o - payload of the message
   */
  broadcast(msg, o) {
    for (let address of this.clients.keys()) {
      // console.log(address);
      this.sendMessage(address, msg, o);
    }
  }

  /**
   * Sends message msg and payload o directly to Client name.
   *
   * The message may be lost or delayed, with the probability
   * defined for this instance.
   *
   * @param {String} address - the public key address of the client or miner to which to send the message
   * @param {String} msg - the name of the event being broadcasted (e.g. "PROOF_FOUND")
   * @param {Object} o - payload of the message
   */
  sendMessage(address, msg, o) {
    if (typeof o !== 'object') throw new Error(`Expecting an object, but got a ${typeof o}`);

    // Serializing/deserializing the object to prevent cheating in single threaded mode.
    // since there are merkle trees in the blocks, this serialize deserialize method will fail
    // let o2 = JSON.parse(JSON.stringify(o));
    let o2 = Object.assign({}, o);
    
    const client = this.clients.get(address);

    let delay = Math.floor(Math.random() * this.messageDelayMax);

    if (Math.random() > this.chanceMessageFails) {
      // console.log(this.clients);
      setTimeout(() => {
        try {
          client.emit(msg, o2);
        } catch (error) {
          console.log(this.clients.keys());
          console.log(address);
          throw new Error('send message fail');
        }
      }, delay);
      
    }
  }

  /**
   * Tests whether a client is registered with the network.
   * 
   * @param {Client} client - the client to test for.
   * 
   * @returns {boolean} True if the client is already registered.
   */
  recognizes(client) {
    return this.clients.has(client.address);
  }

};
