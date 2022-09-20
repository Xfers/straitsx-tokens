// Migration scripts are broken into 2 parts
// One to be used for testing (locally) and one to be used for deployment (mainnet / testnets)

require("dotenv").config();
const FS = require("fs");
const WalletContract = artifacts.require("MultiSigWallet");
const FiatTokenV1 = artifacts.require("./FiatTokenV1.sol");
const FiatTokenProxy = artifacts.require("./FiatTokenProxy.sol");

module.exports = async (deployer, network, accounts) => {
    // Local (ganache) deployment uses the deterministic accounts
    // Other networks e.g. mainnet, ropsten, rinkeby will 1 multisig per function
    // Each multisig has a different set of owners
    if (network == "development" || network == "coverage") {
        await deployer.deploy(FiatTokenV1);
        await deployer.deploy(FiatTokenProxy, FiatTokenV1.address);
    } else {
        const ADDRESSES = JSON.parse(process.env.ADDRESSES);
        const DeployedContractAddresses = {};

        // Todo: Add logger for deployment of contracts
        const TOKEN = await FiatTokenV1.new();
        const PROXY = await FiatTokenProxy.new(TOKEN.address);
        const MASTER_MINTER = await WalletContract.new(
            ADDRESSES.masterMinter,
            1
        );
        const PAUSER = await WalletContract.new(ADDRESSES.pauser, 1);
        const BLACK_LISTER = await WalletContract.new(ADDRESSES.blackLister, 1);
        const OWNER = await WalletContract.new(ADDRESSES.owner, 1);
        const PROXY_ADMIN = await WalletContract.new(ADDRESSES.proxyAdmin, 1);

        DeployedContractAddresses["masterMinter"] = MASTER_MINTER.address;
        DeployedContractAddresses["pauser"] = PAUSER.address;
        DeployedContractAddresses["blackLister"] = BLACK_LISTER.address;
        DeployedContractAddresses["owner"] = OWNER.address;
        DeployedContractAddresses["token"] = TOKEN.address;
        DeployedContractAddresses["proxy"] = PROXY.address;
        DeployedContractAddresses["proxyAdmin"] = PROXY_ADMIN.address;

        // Write to addresses.json
        FS.writeFileSync(
            "configs/addresses.json",
            JSON.stringify(DeployedContractAddresses, null, 4)
        );
    }
};
