module.exports = function (RED) {
  function BrowserlessNode(n) {
    RED.nodes.createNode(this, n);
    this.host = n.host;
    this.port = n.port;
  }
  RED.nodes.registerType("browserless", BrowserlessNode);
};
