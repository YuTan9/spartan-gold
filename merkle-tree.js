const utils = require('./utils.js')

class Node{
    constructor(data = undefined, left = undefined, right = undefined){
        this.data = data;
        this.left = left;
        this.right = right;
        this.isLeaf = false;
    }
}

module.exports = class MerkleTree{
    constructor(){
        this.root = undefined;
        this.txs = 0;
    }
    addTransaction(trx){
        if(this.txs === 0){
            let _node = new Node(trx);
            _node.isLeaf = true;
            this.root = new Node(undefined, _node, undefined);
            this.calcHash({node: this.root, goRight: [false]});
            this.txs += 1;
        }else if(this.isComplete()){
            let _goRight = [];
            let _navigator = this.txs;
            while(_navigator !== 0){
                _goRight.unshift(_navigator % 2 === 1);
                _navigator = Math.floor(_navigator / 2);
            }
            let _new_root = new Node(undefined, this.root, undefined);
            let _ptr = _new_root;
            _goRight.forEach(_direction =>{
                if(_direction){
                    _ptr.right = new Node();
                    _ptr = _ptr.right;
                }else{
                    _ptr.left = new Node();
                    _ptr = _ptr.left;
                }
            });
            _ptr.data = trx;
            _ptr.isLeaf = true;
            this.root = _new_root;
            this.calcHash({node: this.root, goRight: _goRight});
            this.txs += 1;
        }else{
            let _goRight = [];
            let _navigator = this.txs;
            while(_navigator !== 0){
                _goRight.unshift(_navigator % 2 === 1);
                _navigator = Math.floor(_navigator / 2);
            }
            let _ptr = this.root;
            _goRight.forEach(_direction =>{
                if(_direction){
                    if(!_ptr.right)
                        _ptr.right = new Node();
                    _ptr = _ptr.right;
                }
                else{
                    if(!_ptr.left)
                        _ptr.left = new Node();
                    _ptr = _ptr.left;
                }
            });
            _ptr.data = trx;
            _ptr.isLeaf = true;
            this.calcHash({node: this.root, goRight: _goRight});
            this.txs += 1;
        }
        // console.log(this);
    }
    printTree(){
        console.log(JSON.stringify(this.root, null, '   '));
    }
    verifyTree(){
        return this.verifySubTree(this.root);
    }
    get(txId){
        return this.getInSubTree(this.root, txId);
    }
    getAllLeaves(){
        let leaves = new Set();
        this.getLeavesOfSubTree(this.root, leaves);
        return leaves;
    }

    // private functions
    getLeavesOfSubTree(root, leaves){
        if(!root){return;}
        if(root.isLeaf){leaves.add(root.data);}
        else{
            this.getLeavesOfSubTree(root.left, leaves);
            this.getLeavesOfSubTree(root.right, leaves);
        }
    }
    getInSubTree(node, txId){
        if(!node){
            return null;
        }
        if(node.data.id === txId){
            return node;
        }else{
            return this.getInSubTree(node.left, txId) || this.getInSubTree(node.right, txId);
        }
    }
    isComplete(){
        return parseInt( (Math.ceil((Math.log2(this.txs))))) == parseInt( (Math.floor(((Math.log2(this.txs)))))) && this.txs !== 1;
    }
    calcHash({node, goRight}){
        if(node.isLeaf){
            return utils.hash(JSON.stringify(node.data));
        }
        let _direction = goRight.shift();
        let _node = _direction ? node.right : node.left;
        let _node_hash = this.calcHash({node: _node, goRight: goRight});
        let [_left, _right] = [node.left, node.right];
        node.data = this.addHash({left: _left, right: _right});
        return node.data;
    }
    addHash({left, right}){
        if((!!left) && (!!right)){
            if(left.isLeaf && right.isLeaf){
                let left_hash = utils.hash(JSON.stringify(left.data));
                let right_hash= utils.hash(JSON.stringify(right.data));
                return utils.hash(left_hash + right_hash);
            }else{
                return utils.hash(left.data + right.data);
            }
        }else{ // right is undefined
            if(left.isLeaf){
                let left_hash = utils.hash(JSON.stringify(left.data));
                return utils.hash(left_hash + left_hash);
            }else{
                return utils.hash(left.data + left.data);
            }
        }
        throw new Error('[Error]: add hash failed');
    }
    verifySubTree(root){
        // console.log(this.addHash({left: root.left, right: root.right}));
        if(!root || root.isLeaf){
            return true;
        }
        if(root.data !== this.addHash({left: root.left, right: root.right})){
            return false;
        }
        if(!this.verifySubTree(root.left)){
            return false;
        }
        if(!this.verifySubTree(root.right)){
            return false;
        }
        return true;
    }
};
