const https = require('https');
const axios = require('axios');
const config = require('./config');

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

const agent = new https.Agent({
    rejectUnauthorized: false
});

const apiHeader = `Bearer ${config.getApimToken()}`;
const ebayHeader = `Bearer ${config.getEbayToken()}`;

axios.defaults.headers.common['Authorization'] = apiHeader;

const getEbayData = async (ebayUrl) => {
    try {
        return await axios.get(ebayUrl, 
            {headers: {Authorization: apiHeader, Custom: ebayHeader}
        })
    } catch (err) {
        console.log('eBay error')
        console.log(err)
    }
}

const getShippingData = async (shipUrl) => {
    try {
        return await axios.post(shipUrl, {httpsAgent: agent})

    } catch (err) {
        console.log('Ship error')
        console.log(err);
    }
}

const getTaxData = async (taxUrl) => {
    try {
        return await axios.get(taxUrl, {httpsAgent: agent})
    } catch (err) {
        console.log('Tax error')
        console.log(err)
    }
}

const getTotalCost = (itemCost, shippingCost, tax) => {
    taxValue = 1 + parseInt(tax, 10)/100;
    tot = itemCost * taxValue + shippingCost
    return tot.toFixed(2)
}

const getItemId = (ebayItemUrl) => {
    var lastPart = ebayItemUrl.split('/');
    var itemId = lastPart[lastPart.length - 1].split('?')[0];
    return itemId;
}

const calculateShippingCost = async (weight) => {
    var shipUrl = `https://localhost:8243/ship/1.0/shippingCost?countryCode=LK&weight=${weight}&currencyCode=LKR&lang=en`

    var sData = await getShippingData(shipUrl);
    shippingCost = sData.data.data.shippingRates[0].standardRate.amountUsd;
    console.log(`Shipping cost: ${shippingCost}`);

    return shippingCost;
}

const calculateTaxPercetage = async (hsCode) => {
    var taxUrl = `https://localhost:8243/tax/1.0?reporter=144&partner=all&product=${hsCode}&year=2020`

    var tData = await getTaxData(taxUrl);
    var customDuty = tData.data.CustomDuty
    var taxPercent = 0
    for (var i = 0; i < customDuty.length; i++) {
        if (customDuty[i].FtaId == 1111) {
            taxPercent = customDuty[i].TariffReported
            console.log(`Tax: ${taxPercent}`)
            break
        }
    }

    return taxPercent;
}

const calculateItemCost = async (ebay) => {
    var ebayId = getItemId(ebay);
    const ebayUrl = `https://localhost:8243/ebay/1.0?legacy_item_id=${ebayId}`
    const eData = await getEbayData(ebayUrl);

    itemTitle = eData.data.title
    itemCost = eData.data.price.value
    console.log(`Item: ${itemTitle}`);
    console.log(`Item price: ${itemCost}`);

    return itemCost;

}

const calculateCost = async (ebay, weight, hsCode) => {
    console.log('===============================')
    var itemCost = await calculateItemCost(ebay);

    var shippingCost = 0;
    if (weight !== "") {
        shippingCost = await calculateShippingCost(weight);
    }

    var taxPercent = 0;
    if (hsCode !== "") {
        taxPercent = await calculateTaxPercetage(hsCode)
    }   

    totalCost = getTotalCost(itemCost, shippingCost, taxPercent);
    console.log(`Total cost: USD ${totalCost}`)
    var jsonObj = {
        'Item': itemTitle, 
        'Item Price': itemCost,
        'Shipping Cost': shippingCost,
        'Tax Percentage': taxPercent, 
        'Total Cost (USD)': totalCost
    }
    return jsonObj
}

module.exports = { calculateCost }