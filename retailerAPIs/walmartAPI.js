require('dotenv').config()
const NodeRSA = require("node-rsa")
const axios = require('axios')

const keyData = {
    consumerId: process.env.CONSUMER_ID,
    privateKey: process.env.RSA_PRIVATE_KEY,
    keyVer: 1,
}
    
const generateWalmartHeaders = () => {
  const { privateKey, consumerId, keyVer } = keyData;
  const hashList = {
    "WM_CONSUMER.ID": consumerId,
    "WM_CONSUMER.INTIMESTAMP": Date.now().toString(),
    "WM_SEC.KEY_VERSION": keyVer,
  };
  try{
    const sortedHashString = `${hashList["WM_CONSUMER.ID"]}\n${hashList["WM_CONSUMER.INTIMESTAMP"]}\n${hashList["WM_SEC.KEY_VERSION"]}\n`;
    const signer = new NodeRSA(privateKey, "pkcs1");

    const signature = signer.sign(sortedHashString);
    const signature_enc = signature.toString("base64");
    response = {
        "auth": signature_enc,
        "timestamp": hashList["WM_CONSUMER.INTIMESTAMP"],
        "id": hashList["WM_CONSUMER.ID"],
        "keyv": hashList["WM_SEC.KEY_VERSION"]
    }
    
    return {
      "WM_SEC.AUTH_SIGNATURE": signature_enc,
      "WM_CONSUMER.INTIMESTAMP": hashList["WM_CONSUMER.INTIMESTAMP"],
      "WM_CONSUMER.ID": hashList["WM_CONSUMER.ID"],
      "WM_SEC.KEY_VERSION": hashList["WM_SEC.KEY_VERSION"],
    };

  } catch(e){
    console.log("[GenerateHeaders Error]: " + e);
  }
  
};

const walmartAPI = async (url, method) => {
  try{
    if (!url || !method) {
      console.log("Invalid Request")
      console.log(`Provided request details URL: ${url} & METHOD: ${method}`)
      return false;
    }
    const walmartSearch = axios.create({
      baseURL: `https://developer.api.walmart.com/api-proxy/service/affil/product/v2/${url}`,
      method: method,
      headers: generateWalmartHeaders()
    })

    const res = await walmartSearch.request(url);
    
    return res.data

  } catch(e){
    console.log(e)
  }
};

module.exports.walmartAPI = walmartAPI;