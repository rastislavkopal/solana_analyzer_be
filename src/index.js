// make bluebird default Promise
Promise = require('bluebird'); // eslint-disable-line no-global-assign
const User = require('./api/models/user.model');
const SolysisToken = require('./api/models/solysisToken.model');
const { port, env } = require('./config/vars');
const logger = require('./config/logger');
const app = require('./config/express');
const mongoose = require('./config/mongoose');

// open mongoose connection
mongoose.connect();

// start the background jobs automatically
require('./api/jobs/jobs');

User.findOneAndUpdate({ email: 'test@test.com' }, { // init test admin user
  email: 'test@test.com', password: 'dobreheslo', name: 'Danko Panko', role: 'admin',
}, { upsert: true }).exec();

User.findOneAndUpdate({ email: 'token@solysis.xyz' }, { // init test admin user
  email: 'token@solysis.xyz', password: 'ad1QW%43D-6T', name: 'PASS AUTH', role: 'nft',
}, { upsert: true }).exec();

// generate NFT token for test user
SolysisToken.findOneAndUpdate({ mint: '4etgnmeXheqFtkL6Q7H158aMY134macdAaqYyL2UzZEE' }, {
  mint: '4etgnmeXheqFtkL6Q7H158aMY134macdAaqYyL2UzZEE',
}, { upsert: true }).exec();

// listen to requests
app.listen(port, () => logger.info(`server started on port ${port} (${env})`));

/**
* Exports express
* @public
*/
module.exports = app;
