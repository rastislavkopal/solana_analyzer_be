const axios = require('axios');
const cheerio = require('cheerio');
const HttpsProxyAgent = require('https-proxy-agent');
const { proxyAgentUri } = require('../../config/vars');

exports.agent = new HttpsProxyAgent(proxyAgentUri);
