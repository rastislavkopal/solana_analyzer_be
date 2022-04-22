const cron = require('node-cron');
const axios = require('axios');
const Collection = require('../../models/collection.model');
const CollectionTs = require('../../models/collectionTs.model');
const Item = require('../../models/item.model');
const logger = require('../../../config/logger');
const { agent } = require('../../utils/proxyGenerator');
const scrapToken = require('../../crawlers/tokenInfoCrawler');
const CollectionService = require('../../services/collection.service');


// Updates list of collections and its information every 1 minute
// Every hour 0 * * * *
// Every 5 minutes */5 * * * *
const findOverBidsTask = cron.schedule('0 * * * *', async () => {
  try {
    console.log('findOverBidsTask...');
    const items = await Item.find({ forSale: true }, 'mintAddress price');
    let counter = 0;
    const arr = [];
    if (items) {
      items.forEach((item, index) => {
        setTimeout(() => {
          const { mintAddress } = item;
          const { price: currentPrice } = item;
          const config = {
            url: String(`https://api-mainnet.magiceden.dev/v2/tokens/${mintAddress}/offers_received?offset=0&limit=1`),
            httpsAgent: agent,
          };
          axios.request(config).then((response) => {
            counter += 1;
            if (response) {
              const { price: highestBid } = response.data;
              if (highestBid > currentPrice) {
                // console.log('BID FOUND!!!');
                const rObj = {
                  updateOne: {
                    filter: { mintAddress },
                    update: {
                      $set: {
                        steal: true,
                      },
                    },
                    upsert: true,
                  },
                };
                arr.push(rObj);
              }
            }
            if (counter === 100) {
              // console.log('100 item bids checked!');
              Item.bulkWrite(arr, { ordered: false }).catch((err) => {
                logger.error(`findOverBidsTask error 1: ${err}`);
              });
              counter = 0;
              arr.length = 0;
            }
          }).catch((e) => {
            logger.error(`findOverBidsTask error 2: ${e}`);
          });
        }, 200 * (index + 1));
      });
    }
  } catch (error) {
    logger.error(`findOverBidsTask error 3: ${error}`);
  }
});

module.exports = findOverBidsTask;
