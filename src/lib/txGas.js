'use strict';

function Factory(web3){
  const BN = web3.utils.BN;

  return async function(tx){
    let data = await Promise.all([
      web3.eth.estimateGas(tx),
      web3.eth.getBlock('latest')
    ])
    
    const gasEstimation = new BN(data[0]);
    const gasMaxLimit = new BN(data[1].gasLimit);
    const upperGasLimit = gasMaxLimit.muln(0.9)
    const bufferedGasLimit = gasEstimation.muln(1.5)
    
    if(gasEstimation.gt(upperGasLimit)){
      return gasEstimation;
    }
    if(bufferedGasLimit.lt(upperGasLimit)){
      return bufferedGasLimit;
    }
    return upperGasLimit;
  };
}

module.exports = Factory;