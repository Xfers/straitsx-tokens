# StraitsX-tokens (XSGD)

## Token Description
The StraitsX SGD (XSGD) token is the first digital token fully collateralized one-for-one with Singapore Dollar (SGD) and representing 1 SGD. The XSGD token is written as a smart contract on the Ethereum blockchain following the ERC20 standard and is governed by the StraitsX network whereby XSGD tokens are centrally minted and burned by Xfers Pte. Ltd. 

The Xfers payment service is regarded as a Widely Accepted Stored Value Facility under Singapore law. Xfers Pte. Ltd., is the Approved Holder of the Xfers Wallet Stored Value Facility.

https://www.xfers.com/

## Smart Contract Specifications
The XSGD contract has been written by the StraitsX team to fit both the specific needs of the XSGD token as described in the StraitsX Whitepaper and the requirement to comply with local regulation.

The XSGD contract consists of two communicating contracts:
- [token contract](https://github.com/Xfers/StraitsX-tokens/blob/master/Ethereum/contracts/FiatTokenV1.sol)
- [proxy contract](https://github.com/Xfers/StraitsX-tokens/blob/master/Ethereum/contracts/FiatTokenProxy.sol)

The token contract represents a standard fungible token contract with minting and burning features, while an [unstructured storage proxy pattern](https://docs.openzeppelin.com/upgrades-plugins/1.x/proxies#unstructured-storage-proxies) is used for the proxy contract. This pattern enables the proxy to use the logic of the token contract but modifying its own storage state. The proxy can point to the new contract address should there be upgrades to the token implementation in the future.

And one multi-signature contract:
- [multi-signature contract](https://github.com/Xfers/StraitsX-tokens/blob/master/Ethereum/contracts/MultiSigWallet.sol)

The multi-signature contract is a digital signature scheme which allows a group of users(owners) to submit, sign and execute transactions to the proxy contract.

## Token contract 
### Roles and Privileges

| Name | Description & Privileges |
|--|--|
|`owner`| The current owner of the token contract. The `owner` handles critical administrative actions, e.g., determining which address plays which role in the token contract. There is only one `owner` and it is initialized by calling the `initialize()` function.|
|`pauser`| The current pauser of the token contract. The `pauser` is allowed to (un)pause the contract. There is only one `pauser` and it is initialized by calling the `initialize()` function.|
|`masterMinter`| The current master minter of the token contract. The `masterMinter` manages the minters and configures the number of tokens that each minter is allowed to mint. There is only one `masterMinter` and it is initialized by calling the `initialize()` function. |
|`minter`| A role that is allowed to mint and burn new tokens. The token contract defines several minters and the number of tokens that each minter is allowed to mint in the `minterAllowances` field. The `IncreaseMinterAllowance` transition is called by the `masterMinter` for adding a new `minter` by increasing the it's minterAllowance. There can be more than one `minter` in the token contract. |
|`blacklister`| The current blacklister of the token contract. The `blacklister` is used to (un)freeze & wipe the balance from any other account when required to do so by law enforcement. The presence of this function in the code is a mandatory regulatory requirement. StraitsX will never use this function on its own accord. There is only one `blacklister` and it is initialized by calling the `initialize()` function. |
|`msg.sender`| The address that initiated the function call. |

### Mutable Fields 
The table below presents the mutable fields of the token contract and a description of what it is for.

| Name | Type | Description |
|--|--|--|--|
| `name` | `string` | Name of the token |
| `symbol` | `string` | Symbol of the token |
| `decimals` | `uint8` | Decimals of the token |
| `_owner` | `address` | Current `_owner` in the contract. Inherited from `Ownable.sol`. |
| `masterMinter` | `address` | Current `masterMinter` in the contract. |
| `initialized` | `bool` | To keep track if the contract is initialized. `initialize()` can only be called once. |
| `paused` | `bool` | To keep track if the contract is paused. Inherited from `Pausable.sol`. |
| `pauser` | `address` | Current `pauser` in the contract. Inherited from `Pausable.sol`. |
| `balances` | `mapping(address => uint256)` | Tracks the balances of each address. |
| `allowed` | `mapping(address => mapping(address => uint256))` | Tracks the allowances given by each address (owner) to another address (spender). |
| `totalSupply_` | `uint256` | Tracks the total supply of tokens minted on the Ethereum blockchain. |
| `minters` | `mapping(address => bool)` | Tracks the minter status of each address. |
| `minterAllowed` | `mapping(address => uint256)` | Tracks the minter allowance of each address (minter). |
| `blacklister` | `address` | Current `blacklister` in the contract. Inherited from `Blacklistable.sol`. |
| `blacklisted` | `mapping(address => bool)` | Tracks the blacklist status of each address. Inherited from `Blacklistable.sol`. |

### Functions

All the functions in the contract can be categorized into four categories:
- _housekeeping functions meant to facilitate basic admin related tasks.
- _pause functions meant to pause and unpause the contract.
- _minting-related functions that allows mining and burning of tokens.
- _token transfer functions allows to transfer tokens from one user to another.

Each of these category of functions are presented in further details below:

| Name | Params | Description | Callable when paused? |
|--|--|--|--|
|`transferOwnership`|`newOwner : address`| Allows the current `owner` to transfer control of the contract to a `newOwner`. <br> :warning: **Note:** 1) msg.sender must be the current `owner` in the contract, 2) The `newOwner` cannot be the null address or current owner. | :heavy_check_mark: |
|`updatePauser`| `_newPauser : address` | Replace the current `pauser` with the `_newPauser`. <br> :warning: **Note:** 1) msg.sender must be the current `owner` in the contract, 2) The `_newPauser` cannot be the null address or the current pauser. | :heavy_check_mark: |
|`blacklist`|`_account : address`| Blacklists a given `_account`. A blacklisted address can neither send or receive tokens. Any `_account` regardless of role can be blacklisted. <br> :warning: **Note:** 1) msg.sender must be the current `blacklister` in the contract, 2) The `_account` to be blacklisted cannot be the null address or is already blacklisted. | :heavy_check_mark: |
|`unBlacklist`|`_account : address`| Removes a given `_account` from the blacklist. <br> :warning: **Note:** 1) msg.sender must be the current `blacklister` in the contract, 2) The `_account` to be removed from the blacklist cannot be the null address or is not blacklisted. | :heavy_check_mark: |
|`updateBlacklister`|`_newBlacklister : address`| Replace the current `blacklister` with the `_newBlacklister`. <br> :warning: **Note:** 1) msg.sender must be the current `owner` in the contract, 2) The `_newBlacklister` cannot be the null address or the current blacklister. | :heavy_check_mark: |
|`updateMasterMinter`| `_newMasterMinter : address` | Replace the current `masterMinter` with the `_newMasterMinter`. <br> :warning: **Note:** 1) msg.sender must be the current `owner` in the contract, 2) The `_newMasterMinter` cannot be the null address or the current master minter. | :heavy_check_mark: |
|`increaseMinterAllowance`| `_minter : address, _increasedAmount : uint256` | Increase the number of tokens that a `_minter` is allowed to mint. <br> :warning: **Note:** 1) msg.sender must be the current `masterMinter` in the contract, 2) The `_minter` cannot be the null address. | :heavy_check_mark: |
|`decreaseMinterAllowance`| `_minter : address, _decreasedAmount : uint256` | Decrease the number of tokens that a `_minter` is allowed to mint. <br> If the `_decreasedAmount` to be subtracted is greater than or equal to the `_minter`'s `minterAllowed`, the `_minter` will have its minter status revoked. Once removed, they will not be able to continue burning. <br> :warning: **Note:** 1) msg.sender must be the current `masterMinter` in the contract, 2) The `minter` cannot be the null addresss and must be a current minter. | :heavy_check_mark: |

#### Pause functions

| Name | Params | Description | Callable when paused? |
|--|--|--|--|
|`pause`| None | Pause the contract to temporarily stop all transfer of tokens and other operations. <br> :warning: **Note:** 1) msg.sender must be the current `pauser` in the contract. | :heavy_check_mark: |
|`unpause`| None | Unpause the contract to re-allow all transfer of tokens and other operations. <br> :warning: **Note:** 1) msg.sender must be the current `pauser` in the contract. | :heavy_check_mark: |

#### Minting-related functions

| Name | Params | Description | Callable when paused? |
|--|--|--|--|
|`mint`| `_to: address, _amount : uint256` | Mint `_amount` number of new tokens and allocate them to the `_to` address.  <br>  :warning: **Note:** 1) Minting is a privileged transition that can be invoked only by non-blacklisted minters, i.e., msg.sender must be a non-blacklisted `minter`, 2) Minting can only be done when the contract is not paused, 3) The `_to` address cannot be blacklisted nor null. | <center>:x:</center> |
|`burn`| `_amount : uint256` | Burn `_amount` number of tokens.  <br>  :warning: **Note:**   1) Burning is a privileged transition that can be invoked only by non-blacklisted minters, i.e., msg.sender must be a non-blacklisted `minter`, 2) Burning can only be done when the contract is not paused. | <center>:x:</center>  |
|`lawEnforcementWipingBurn`| `_from : address` | Burn entire balance of tokens from `address`.  <br>  :warning: **Note:** 1) Only the blacklister can invoke this transition, i.e., msg.sender must be a non-blacklisted `blacklister`, 2) Burning can only be done when the contract is not paused, 3) Only accounts that have been blacklisted by the `blacklister` may have their funds wiped.| <center>:x:</center>  |

#### Token Transfer functions

| Name | Params | Description | Callable when paused? |
|--|--|--|--|
|`increaseAllowance`| `_spender : address, _addedValue : uint256` | Increase token allowance by `_addedValue` amount of a `_spender` to spend on behalf of a token holder. <br> :warning: **Note:** 1) msg.sender and `spender` must not be blacklisted, 2) Increasing allowance can only be done when the contract is not paused. | <center>:x:</center>  |
|`decreaseAllowance`| `_spender : address, _subtractedValue : uint256` | Decrease `_subtractedValue` amount of a `_spender` to spend on behalf of a token holder. <br> :warning: **Note:** 1) msg.sender and `spender` must not be blacklisted, 2) Decreasing allowance can only be done when the contract is not paused. | <center>:x:</center>  |
|`transfer`| `_to : address, _amount : uint256` | Transfer `_amount` number of tokens from msg.sender to the `_to` address.  <br>  :warning: **Note:** 1) msg.sender and `to` addresses should not be blacklisted, 2) `_to` cannot be the null address, 3) `transfer` can only be called when the contract is not paused. |<center>:x:</center>  |
|`transferFrom`| `_from : address, _to : address, _amount : uint256` | Transfer `_amount` number of tokens on behalf of `_from` to the `to` address.  <br>  :warning: **Note:**  1) msg.sender, `_from`  and `_to` addresses should not be blacklisted, 2) `_to` cannot be the null address, 3) `transferFrom` can only be called when the contract is not paused. |<center>:x:</center>  |

## Proxy Contract

The proxy contract points to a contract implementation which it derives its logic from. You can understand more by reading this [detailed explanation](https://docs.openzeppelin.com/upgrades-plugins/1.x/proxies#unstructured-storage-proxies) or by going through their [documentation](https://docs.zeppelinos.org/docs/2.2.0/upgradeability_adminupgradeabilityproxy). 

## Multi-signature Contract

The multi signature contract is the [same contract](https://github.com/gnosis/MultiSigWallet/blob/master/contracts/MultiSigWallet.sol) that is used by Gnosis. 

This contract holds funds that can be paid out to arbitrary users, provided that enough people in the collection of owners sign off on the payout. The transaction must be added to the contract before signatures can be collected. Once enough signatures are collected, the transaction will automatically be executed and if successful, the money paid out.

If an owner changes his mind about a transaction, the signature can be revoked until the transaction is executed.

WARNING:

If a sufficient number of owners lose their private keys, or for any other reason are unable or unwilling to sign for new transactions, the funds in the wallet will be locked forever. It is therefore a good idea to set required_signatures to a value strictly less than the number of owners, so that the remaining owners can retrieve the funds should such a scenario occur.

If an owner loses his private key, the remaining owners should move the funds to a new wallet to ensure that funds are not locked if another owner loses his private key. The owner who originally lost his private key can generate a new key, and the corresponding address be added to the new wallet, so that the same set of persons own the new wallet.

### Multi-signature contract Roles and Privileges

| Name | Description & Privileges |
|--|--|
|`owners` | The users who own this contract. |

### Mutable Fields

The table below presents the mutable fields of the contract and their initial values.

| Name | Type| Description |
|--|--|--|
|`transactions`|`mapping (uint => Transaction)`| To track the transactions that are added onto the multisig wallet.|
|`confirmations`|`mapping (uint => mapping (address => bool))`| To track which transactions have been confirmed by which owner.|
|`isOwner`|`mapping (address => bool)`| To which addresses are owners in this multisig.|
|`owners`|`address[]`| An optimization to track the existing owners in the multisig.|
|`required`|`uint`| The number of signatures required per transaction.|
|`transactionCount`|`uint`| The number of transactions created to date. This also acts as a unique identifier for each transaction as it can only increase.|

### Functions

All the functions in the contract can be categorized into two categories:
- _housekeeping functions_ to add, remove, replace owners and change number of signatures required.
- _action functions_ let owners create and execute transactions, sign and revoke signatures.


#### Housekeeping functions

| Name | Params | Description |
|--|--|--|
|`addOwner`| `owner : address` | To add `owner` address as a new owner of the multisig contract. |
|`removeOwner`| `owner : address` | To remove `owner` address as one of the owners of the multisig contract. |
|`replaceOwner`| `owner : address, newOwner : address` | To replace `owner` with `newOwner` as an owner of the multisig contract. |
|`changeRequirement`| `_required : uint` | To update the number of signatures required for a transaction to be executed. |

#### Action functions

| Name | Params | Description |
|--|--|--|
|`submitTransaction`| `destination : address, value : uint, data : bytes` | To submit a transaction that when executed will `call()` the `destination` address with `value` msg.value and `data` msg.data. |
|`confirmTransaction`| `transactionId : uint` | Sign off an existing transaction. |
|`revokeConfirmation`| `transactionId : Uint32` | Revoke signature off an existing transaction. |
|`executeTransaction`| `transactionId : Uint32` | Execute an existing transaction. |

## Potential signature pitfalls

* Order cannot be enforced on the signed transactions.
* Transactions could potentially be invalidated by sending a previously signed transaction by using the same nonce, if one chooses to do that they can only be sure once it is executed and risk other errors, it is recommended for one to be very sure before executing a transaction.

## Setup

### Prerequisites
Ensure you are using node version 8.x.
NOTE: node 8.x is not available via Homebrew. Instead install nvm and use it to install node 8.x (Instructions found [here](https://github.com/nvm-sh/nvm#install--update-script)).

install nvm:
`curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash`

install node 8.x (in this example, node 8.11.1):
`nvm install 8.11.1`

### Installation
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

#### .env considerations

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

### Testing

All tests are run with:
`npm run truffle-test`

or run a specific file of tests with:
`npm run truffle-test -- [file]`

to generate test coverage on all tests run:
`npm test`

#### Contracts

The implementation uses 2 separate contracts - a proxy contract (`FiatTokenProxy.sol`)and an implementation contract(`FiatToken.sol`). This allows upgrading the contract, as a new implementation contact can be deployed and the Proxy updated to point to it.

#### FiatToken

The FiatToken offers a number of capabilities, which briefly are described below. There is a more [detailed design docs](./doc/tokendesign.md) in the `doc` folder.

##### Pausable

The entire contract can be frozen, in the event a serious bug is found or if there is a key compromise. No transfers can take place while the contract is paused. Access to the pause functionality is controlled by the `pauser` address.

##### Upgradable

A new implementation contract can be deployed, and the proxy contract will forward calls to the new contract. Access to the upgrade functionality is guarded by a `proxyOwner` address. Only the `proxyOwner` address can change the `proxyOwner` address.

##### Blacklist

The contract can blacklist certain addresses which will prevent those addresses from transferring or receiving tokens. Access to the blacklist functionality is controlled by the `blacklister` address.

##### Minting/Burning

Tokens can be minted or burned on demand. The contract supports having multiple minters simultaneously. There is a `masterMinter` address which controls the list of minters and how much each is allowed to mint. The mint allowance is similar to the ERC20 allowance - as each minter mints new tokens their allowance decreases. When it gets too low they will need the allowance increased again by the `masterMinter`.

##### Ownable

The contract has an Owner, who can change the `owner`, `pauser`, `blacklister`, or `masterMinter` addresses. The `owner` can not change the `proxyOwner` address.

## Trust Model

There are many privileged roles in with the ability to make critical modifications to the smart contract like the `owner`, `masterMinter` and `blackLister`. As a regulated entity, our actions are held to high standards - read more [here](https://eservices.mas.gov.sg/fid/institution/detail/226546-XFERS-PTE-LTD). Moreover, we have also put in place multiple measures to ensure that these roles are secured, such as restricted access, no single point of failure, regular third party attestations and even contingency plans to handle the unlikely event of a compromise of any of these privileged roles.
