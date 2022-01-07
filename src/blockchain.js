/**
 *                          Blockchain Class
 *  The Blockchain class contain the basics functions to create your own private blockchain
 *  It uses libraries like `crypto-js` to create the hashes for each block and `bitcoinjs-message` 
 *  to verify a message signature. The chain is stored in the array
 *  `this.chain = [];`. Of course each time you run the application the chain will be empty because and array
 *  isn't a persisten storage method.
 *  
 */

const SHA256 = require('crypto-js/sha256');
const BlockClass = require('./block.js');
const bitcoinMessage = require('bitcoinjs-message');
const Block = require('bitcoinjs-lib/src/block');

class Blockchain {

    /**
     * Constructor of the class, you will need to setup your chain array and the height
     * of your chain (the length of your chain array).
     * Also everytime you create a Blockchain class you will need to initialized the chain creating
     * the Genesis Block.
     * The methods in this class will always return a Promise to allow client applications or
     * other backends to call asynchronous functions.
     */
    constructor() {
        this.chain = [];
        this.height = -1;
        this.initializeChain();
        this.validateChain();

        const address ="1PqXTNFDEFmupGYFDzYhJUn4jgTtGPU51A";
        const message = "1PqXTNFDEFmupGYFDzYhJUn4jgTtGPU51A:1641555438:starRegistry";
        const signature = "H7Ifo3xVYhAIkcWtFGteTcEXDn1mNZIZz804W7eQKCDIX6dF1nOItjDFRqgL7pdLdBpqmioCFXr0ro33KXZY5cc=";
        const star = {
            dec:"332",
            ra:"w23",
            story:"my luckystar"
        };
        
        // unit test of the application
        const block = this.submitStar(address, message, signature, star);



    }

    /**
     * This method will check for the height of the chain and if there isn't a Genesis Block it will create it.
     * You should use the `addBlock(block)` to create the Genesis Block
     * Passing as a data `{data: 'Genesis Block'}`
     */
    async initializeChain() {
        if (this.height === -1) {
            let block = new BlockClass.Block({ data: 'Genesis Block' });
            await this._addBlock(block);
        }
    }

    /**
     * Utility method that return a Promise that will resolve with the height of the chain
     */
    getChainHeight() {
        let self = this;
        return new Promise((resolve, reject) => {
            resolve(self.height);
            return;
        });
    }

    /**
     * _addBlock(block) will store a block in the chain
     * @param {*} block 
     * The method will return a Promise that will resolve with the block added
     * or reject if an error happen during the execution.
     * You will need to check for the height to assign the `previousBlockHash`,
     * assign the `timestamp` and the correct `height`...At the end you need to 
     * create the `block hash` and push the block into the chain array. Don't for get 
     * to update the `this.height`
     * Note: the symbol `_` in the method name indicates in the javascript convention 
     * that this method is a private method. 
     */
    _addBlock(block) {
        let self = this;
        return new Promise(async (resolve, reject) => {
            try {
                // if the new block is not the genesis block and the chain has been initialized  
                //let chain_height = await this.getChainHeight();
                // assign the height to the new block incrementing the chain height (genesis assigned 0)
                const updated_height = self.height + 1 ;
                block.height = updated_height ;
                if (self.height > 0){
                    // assign the hash of current block in the chain (before adding the new block) as the previousBlockHash
                    block.previousBlockHash = await self.chain.at(-1).hash;
                    // genesis block will be initilized with null value
                }
                // assign timestamp to the new block
                block.time = new Date().getTime().toString().slice(0, -3).toString();
                //calculate the hash of the Block
                block.hash = SHA256(JSON.stringify(block)).toString();
                // push the new block in the chain array
                self.chain.push(block);
                // increment the height of the chain after inserting the new block 
                self.height = updated_height; 
                resolve(block);
            }
            catch (error) {
                reject(error);
            }
        });
    }

    /**
     * The requestMessageOwnershipVerification(address) method
     * will allow you  to request a message that you will use to
     * sign it with your Bitcoin Wallet (Electrum or Bitcoin Core)
     * This is the first step before submit your Block.
     * The method return a Promise that will resolve with the message to be signed
     * @param {*} address 
     */
    requestMessageOwnershipVerification(address) {
        return new Promise((resolve) => {
            resolve("${address}:${new Date().getTime().toString().slice(0, -3)}:starRegistry");
        });
    }

    /**
     * The submitStar(address, message, signature, star) method
     * will allow users to register a new Block with the star object
     * into the chain. This method will resolve with the Block added or
     * reject with an error.
     * Algorithm steps:
     * 1. Get the time from the message sent as a parameter example: `parseInt(message.split(':')[1])`
     * 2. Get the current time: `let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));`
     * 3. Check if the time elapsed is less than 5 minutes
     * 4. Veify the message with wallet address and signature: `bitcoinMessage.verify(message, address, signature)`
     * 5. Create the block and add it to the chain
     * 6. Resolve with the block added.
     * @param {*} address 
     * @param {*} message 
     * @param {*} signature 
     * @param {*} star 
     */
    submitStar(address, message, signature, star) {
        let self = this;
        return new Promise(async (resolve, reject) => {
            try {
                const time_message = parseInt(message.split(':')[1]);
                const current_time = parseInt(new Date().getTime().toString().slice(0, -3));
                const elapsed_time = (current_time - time_message);
                //if (elapsed_time > 5 * 60 ) { 
                //    throw ("Time elapsed since request initiated is greater than 5 minutes")
                //}
                if (bitcoinMessage.verify(message, address, signature)) {
                    // ensure that the chain is initalized 
                    self.initializeChain();
                    let block = new BlockClass.Block({"owner":address, "star": star});
                    await self._addBlock(block);
                    resolve(block);
                }
                else { throw ("Message with address and signature failed the validation") }
            }
            catch (error) { reject(error); }
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block
     *  with the hash passed as a parameter.
     * Search on the chain array for the block that has the hash.
     * @param {*} hash 
     */
    getBlockByHash(hash) {
        let self = this;
        return new Promise((resolve, reject) => {
            try {
                var matching_block_array = self.chain.filter(function (block) {
                    return block.hash === hash; 
                  });
                if(matching_block_array.lenght === 1) {
                    resolve(matching_block_array);
                }
                else if (matching_block_array == null) { 
                    throw ("Blockchain does countain a block with this hash value")
                }
                else {
                    throw ("Blockchain countains more than one block with the same hash value")
                }
            }
            catch (error) {reject(error);}
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block object 
     * with the height equal to the parameter `height`
     * @param {*} height 
     */
    getBlockByHeight(height) {
        let self = this;
        return new Promise((resolve, reject) => {
            let block = self.chain.filter(p => p.height === height)[0];
            if (block) {
                resolve(block);
            } else {
                resolve(null);
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with an array of Stars objects existing in the chain 
     * and are belongs to the owner with the wallet address passed as parameter.
     * Remember the star should be returned decoded.
     * @param {*} address 
     */
    getStarsByWalletAddress(address) {
        let self = this;
        let stars = []; // stars array for storing all stars associated to one address
        return new Promise((resolve, reject) => {
            try {
                self.chain.forEach(async (block) => {
                    let data = await block.getBData();
                    if(data){
                        if (data.owner === address){
                            stars.push(data); //push each star's data to array.
                        }
                    }
                });
            resolve(stars);
            }
            catch (error) {reject(error);}
        });
    }

    /**
     * This method will return a Promise that will resolve with the list of errors when validating the chain.
     * Steps to validate:
     * 1. You should validate each block using `validateBlock`
     * 2. Each Block should check the with the previousBlockHash
     */
    validateChain() {
        let self = this;
        let errorLog = [];
        return new Promise(async (resolve, reject) => {
            var previous_block_hash = null;
            self.chain.forEach(function (block) {
                // call the block validation function on the current block
                block.validate().then((result) => {
                }).catch((error) => {
                    errorLog.push(error);
                });
                // check that the previousBlockHash stored in the current block is equal to the previous block hash
                if ((block.height > 0) && (previous_block_hash != block.previousBlockHash)) {
                    //var err = New Error(['hash value of previous block not consistent with block ', block.height.toString]);
                    errorLog.push(['Hash value of previous block not consistent with block ', block.height.toString]);
                }
                // store the current block hash
                previous_block_hash = block.hash;
            });
            resolve(errorLog);
            // validateChain() function will be executed every time a new request to add a block (through the endpoint submitStar and validateChain)
        });
    }

}

module.exports.Blockchain = Blockchain;   