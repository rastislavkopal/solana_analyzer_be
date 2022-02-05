const axios = require('axios');
const cheerio = require('cheerio');
// const util = require('util');
// const HttpsProxyAgent = require('https-proxy-agent');
// const tunnel = require('tunnel');

exports.proxyGenerator = async () => {
  const ipAddresses = [];
  const portNumbers = [];
  let options;

  await axios.get('https://sslproxies.org/').then((response) => {
    const $ = cheerio.load(response.data);

    $('td:nth-child(1)').each((index, element) => {
      ipAddresses[index] = $(element).text();
    });

    $('td:nth-child(2)').each((index, element) => {
      portNumbers[index] = $(element).text();
    });

    ipAddresses.join(', ');
    portNumbers.join(', ');

    const rand = Math.floor(Math.random() * 100);

    // options = {
    //   proxy: false,
    //   httpsAgent: tunnel.httpsOverHttp({
    //     proxy: {
    //       host: String(ipAddresses[rand]),
    //       port: parseInt(portNumbers[rand], 10),
    //     },
    //   }),
    // };
    // options = {
    //   proxy: false,
    //   httpsAgent: new HttpsProxyAgent(`http://${ipAddresses[rand]}:${portNumbers[rand]}`),
    // };
    options = `http://${ipAddresses[rand]}:${portNumbers[rand]}`;
    console.log(options);
  });
  return options;
};
