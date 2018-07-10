const CryptoJS = require("crypto-js");


const calculateHash = function(_id, previousHash, data){
    return CryptoJS.SHA256(_id + previousHash + data).toString();
}

module.exports = {
    calculateHash
}