const { default: handler } = require('../dist/main');

module.exports = (req, res) => {
  return handler(req, res);
};
