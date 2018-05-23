// taken from https://stackoverflow.com/a/46957474/2430274
async function assertThrowsAsync(fn, regExp) {
  let f = () => {};
  try {
    await fn();
  } catch(e) {
    f = () => {throw e};
  } finally {
    assert.throws(f, regExp);
  }
}

exports.assertThrowsAsync = assertThrowsAsync;

exports.now = Math.round(Date.now() / 1000);
const minutes = 60;
const hours = 60 * minutes;
const days = 24 * hours;
const months = 30 * days;
exports.days = days;
exports.months = months;

exports.ether = web3.toWei(1);
exports.finney = 1000;

exports.gasPrice = 10000000000;

exports.OWNER = 1;
exports.TENANT = 2;
exports.ROBBER = 3;

exports.ONTIME = 0;
exports.BELATED = 1;
exports.DEFAULTED = 2;
