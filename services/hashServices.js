const CryptoJS = require("crypto-js");


const calculateHash = function(index, previousHash, data){
    return CryptoJS.SHA256(index + previousHash + data).toString();
}

module.exports = {
    calculateHash
}