// Migration scripts are broken into 2 parts
// One to be used for testing (locally) and one to be used for deployment (mainnet / testnets)

require("dotenv").config();
const FS = require("fs");
const HELPER = require("./helper.js");

const FiatTokenV1 = artifacts.require("./FiatTokenV1.sol");
const FiatTokenProxy = artifacts.require("./FiatTokenProxy.sol");
const THROWAWAY_ADDRESS = process.env.THROWAWAY_ADDRESS;

module.exports = async (deployer, network, accounts) => {
    let admin;
    let masterMinter;
    let pauser;
    let blackLister;
    let owner;
    let tokenAddr;
    let proxyAddr;

    if (network == "development" || network == "coverage") {
        // these are the deterministic addresses from ganache, so the private keys are well known
        // and match the values we use in the tests
        admin = accounts[14];
        masterMinter = accounts[6];
        pauser = accounts[8];
        blackLister = accounts[4];
        owner = accounts[3];
        tokenAddr = FiatTokenV1.address;
        proxyAddr = FiatTokenProxy.address;
    } else {
        const ADDRESSES = JSON.parse(
            FS.readFileSync("configs/addresses.json", "utf8")
        );
        admin = ADDRESSES.proxyAdmin;
        masterMinter = ADDRESSES.masterMinter;
        pauser = ADDRESSES.pauser;
        blackLister = ADDRESSES.blackLister;
        owner = ADDRESSES.owner;
        tokenAddr = ADDRESSES.token;
        proxyAddr = ADDRESSES.proxy;
    }

    var fiatTokenV1 = await FiatTokenV1.at(tokenAddr);
    HELPER.tx(
        await fiatTokenV1.initialize(
            "",
            "",
            0,
            THROWAWAY_ADDRESS,
            THROWAWAY_ADDRESS,
            THROWAWAY_ADDRESS,
            THROWAWAY_ADDRESS
        ),
        "Initializing fiat token implementation with dummy values"
    );

    var fiatTokenProxy = await FiatTokenProxy.at(proxyAddr);

    // need to change admin first, or the call to initialize won't work
    // since admin can only call methods in the proxy, and not forwarded methods
    HELPER.tx(
        await fiatTokenProxy.changeAdmin(admin),
        "Reassigning proxy admin"
    );

    fiatTokenProxy = await FiatTokenV1.at(proxyAddr);
    HELPER.tx(
        await fiatTokenProxy.initialize(
            "XIDR",
            "XIDR",
            6,
            masterMinter,
            pauser,
            blackLister,
            owner
        ),
        "Initializing fiat token implementation within the proxy"
    );
};
