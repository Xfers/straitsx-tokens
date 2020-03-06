# StraitsX-tokens

Fiat tokens on the [Xfers](https://www.xfers.com/sg/straitsx-sg/).

# Potential signature pitfalls

– Order cannot be enforced on the signed transactions.
– Transactions could potentially be invalidated by sending a previously signed transaction by using the same nonce, if one chooses to do that they can only be sure once it is executed and risk other errors, it is recommended for one to be very sure before executing a transaction.

# Setup

## Prerequisites
Ensure you are using node version 8.x. 

## Installation
install truffle:
`npm install -g truffle`

install ganache-cli:
`npm install -g ganache-cli`

clone the repo and cd into it
`git clone https://github.com/Xfers/Xfers-XSGD.git`

install project npm dependencies:
`npm install`

create .env file
`touch .env`

edit the .env file
`vi .env`

### .env considerations

-   For local ganache testing, you only need to specify a random THROWAWAY_ADDRESS.
-   If you wish to deploy to mainnet or testnets, you will also need to specify DEPLOYER_MNEMONIC, ACCESS_TOKEN and ADDRESSES.
-   DEPLOYER_MNEMONIC is the mnemonic of a HD wallet with which the deployer account is the first address. This deployer account will be used for deploying the contracts and should already have some ETH in it. If you do not have this, you can generate a mnemonic [here](https://iancoleman.io/bip39/#english) and get some testnet eth from this [faucet](https://faucet.metamask.io/).
-   ACCESS_TOKEN is your infura project id. If you do not have one, please make an account on the [official infura website](https://infura.io/) and create a project.
-   Since each role will be controlled by a multisig, ADDRESSES represents the list of owners to be used in each multisig.
-   See the example .env file below for a full example.

#### Example .env file

```
DEPLOYER_MNEMONIC=increase claim burden grief voyage kingdom crawl master body dice firm siren engage glow museum flash fatigue minute letter rubber learn whale goat mass
THROWAWAY_ADDRESS=0x1f78c0E00e7CA8778317Fd423cfDA6f34d268F32
ACCESS_TOKEN=0123456789abcdef01234567abcdef01
ADDRESSES='{"masterMinter":["0xCe10C1eD23d75E226eda773d4dd8954dea105575","0xf110af857071B803f7Ab0732AE6bcfEF5DE097a1"],"pauser":["0x10f85b9d609E4aB41ad73562Fbd16F55BcAcE792","0x780ab28B69D312c1057fDA2D0E05505431d542e5"],"blackLister":["0x642896aF247cB8Ea27D75daBb0a6339d748d93Eb","0x480EB74e96690Bf61Dc51520aad91cE9F52fe2Cb"],"owner":["0x508b0CDc6Ee2223d2C71da74c3d38A7C8e60f0Ec","0x441eaB0c2846FC3de41a4f84526cFFcD7689E87d"],"proxyAdmin":["0xF402Ad269b0694E62c2aAC64D63997aeC823170d","0xA0D83F181f401f7062A0C458fE6a829F47D8951f"]}'
```

# Testing

All tests are run with:
`npm run truffle-test`

or run a specific file of tests with:
`npm run truffle-test -- [file]`

to generate test coverage on all tests run:
`npm test`

# Contracts

The implementation uses 2 separate contracts - a proxy contract (`FiatTokenProxy.sol`)and an implementation contract(`FiatToken.sol`). This allows upgrading the contract, as a new implementation contact can be deployed and the Proxy updated to point to it.

## FiatToken

The FiatToken offers a number of capabilities, which briefly are described below. There is a more [detailed design docs](./doc/tokendesign.md) in the `doc` folder.

### Pausable

The entire contract can be frozen, in the event a serious bug is found or if there is a key compromise. No transfers can take place while the contract is paused. Access to the pause functionality is controlled by the `pauser` address.

### Upgradable

A new implementation contract can be deployed, and the proxy contract will forward calls to the new contract. Access to the upgrade functionality is guarded by a `proxyOwner` address. Only the `proxyOwner` address can change the `proxyOwner` address.

### Blacklist

The contract can blacklist certain addresses which will prevent those addresses from transferring or receiving tokens. Access to the blacklist functionality is controlled by the `blacklister` address.

### Minting/Burning

Tokens can be minted or burned on demand. The contract supports having multiple minters simultaneously. There is a `masterMinter` address which controls the list of minters and how much each is allowed to mint. The mint allowance is similar to the ERC20 allowance - as each minter mints new tokens their allowance decreases. When it gets too low they will need the allowance increased again by the `masterMinter`.

### Ownable

The contract has an Owner, who can change the `owner`, `pauser`, `blacklister`, or `masterMinter` addresses. The `owner` can not change the `proxyOwner` address.