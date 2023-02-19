// Migration scripts are broken into 2 parts
// One to be used for testing (locally) and one to be used for deployment (mainnet / testnets)

const FiatTokenV1 = artifacts.require("./FiatTokenV1.sol");
const FiatTokenProxy = artifacts.require("./FiatTokenProxy.sol");
const FS = require('fs');

module.exports = async (deployer, network, accounts) => {
    let admin;
    let masterMinter;
    let pauser;
    let blackLister;
    let owner;
    let tokenAddr;
    let proxyAddr;

    if (network == "development" || network == "coverage") {
        admin = accounts[14];
        masterMinter = accounts[6];
        pauser = accounts[8];
        blackLister = accounts[4];
        owner = accounts[3];
        tokenAddr = FiatTokenV1.address;
        proxyAddr = FiatTokenProxy.address;
    } else {
        const ADDRESSES = JSON.parse(FS.readFileSync("configs/addresses.json", "utf8"));
        admin = ADDRESSES.proxyAdmin;
        masterMinter = ADDRESSES.masterMinter;
        pauser = ADDRESSES.pauser;
        blackLister = ADDRESSES.blackLister;
        owner = ADDRESSES.owner;
        tokenAddr = ADDRESSES.token;
        proxyAddr = ADDRESSES.proxy;
        treasury = ADDRESSES.treasuryWallet;
        minter = ADDRESSES.minter;
    }
    // Print ADDRESSES of deployed contracts
    console.log();
    console.log(`   Contract Addresses`);
    console.log('   ------------------------');
    console.log(`   ${"> Master Minter:".padEnd(23, " ")} ${masterMinter}`);
    console.log(`   ${"> Pauser:".padEnd(23, " ")} ${pauser}`);
    console.log(`   ${"> Black Lister:".padEnd(23, " ")} ${blackLister}`);
    console.log(`   ${"> Owner:".padEnd(23, " ")} ${owner}`);
    console.log(`   ${"> Token:".padEnd(23, " ")} ${tokenAddr}`);
    console.log(`   ${"> Proxy:".padEnd(23, " ")} ${proxyAddr}`);
    console.log(`   ${"> Proxy Admin:".padEnd(23, " ")} ${admin}`);
    console.log(`   ${"> Treasury:".padEnd(23, " ")} ${treasury}`);
    console.log(`   ${"> Minter:".padEnd(23, " ")} ${minter}`);
    console.log();
};