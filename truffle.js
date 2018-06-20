const HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "maleta abdomen ver onda zumo rojizo dormir carga utopía obra petróleo zapato toro abeja defensa acceso tenis sutil obrero quince ahorro tez humo activo";
var endpoint = "https://kovan.infura.io/ydpS5qV3KiVYbC4EfD1R";

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8875,
      network_id: 37
    },
    kovan: {
      provider: function() {
	return new HDWalletProvider(mnemonic, endpoint);
      },
      network_id: 42
    }
  },
  mocha: {
    reporter: "eth-gas-reporter",
    reporterOptions: {
      currency: "USD",
    }
  }
};
