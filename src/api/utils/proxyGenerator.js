const axios = require('axios');
const cheerio = require('cheerio');
const HttpsProxyAgent = require('https-proxy-agent');
const { proxyAgentUri } = require('../../config/vars');

exports.agent = new HttpsProxyAgent(proxyAgentUri);

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

    options = `http://${ipAddresses[rand]}:${portNumbers[rand]}`;
  });
  return options;
};
