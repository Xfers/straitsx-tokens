# Xfers SGDX Stable Coin

The SGDX stablecoin consists of two communicating contracts namely a [token contract](https://github.com/AmritKumar/xfers-contracts/blob/master/contracts/sgdx_contract.scilla) and a [proxy contract](https://github.com/AmritKumar/xfers-contracts/blob/master/contracts/proxy.scilla). The token contract represents a standard fungible token contract with minting and burning features, while the proxy contract is a typical relay contract that redirects all calls to the token contract. The purpose of the proxy contract is to allow upgradeability of the token contract in scenarios where the token contract is found to contain bugs.

## Roles and Privileges in the Token Contract

Each of the contracts defines specific roles which comes with certain privileges. 

| Name | Description & Privileges |
|--|--|
|`init_owner` | The initial owner of the contract which is usually the creator of the contract.  `init_owner` is the initial value of several other roles. |
|`owner` | Current owner of the contract initialized to `init_owner`. Certain critical actions can only be performed by the `owner`, e.g., changing who plays certain roles in the contract. |
|`pauser` | Account that is allowed to (un)pause the contract. It is initialized to `init_owner`.  `pauser` can (un) pause the contract. There is only `pauser` for the contract. |
|`masterMinter` | The master minter to manage the minters for the contract.  `masterMinter` can add or remove minters and configure the number of tokens that a minter is allowed to mint. There is only one `masterMinter` for the contract. |
| `minter` | An account that is allowed to mint and burn new tokens. The contract defines several minters. Each `minter` has a quota for minting new tokens. |
| `blacklister` | An account that can blacklist any other account. Blacklisted account can neither transfer or receive tokens. There is only one `blacklister`. |
|`defaultOperators` | These are "trusted" parties defined at the contract deployment time who can any number of tokens on behalf of a token holder.|
|`approvedSpender`| A token holder can designate a certain address to send a up to a certain number of tokens on its behalf. These addresses will be called `approvedSpender`.  |
||||

## Immutable parameters of the Token Contract

The table below list the parameters that are defined at the contrat deployment time and hence cannot be changed later on.

| Name | Type | Description |
|--|--|--|
|`name`| `String` | A human readable token name. |
|`symbol`| `String` | A ticker symbol for the token. |
|`symbol`| `String` | A ticker symbol for the token. |
|`decimals`| `Uint32` | Defines the smallest unit of the tokens|
|`init_owner`| `ByStr20` | The initial owner of the contract. |
|`default_operators` | `List ByStr20` |A list of default operators for the contract. |
|`proxy_address` | `ByStr20` | Address of the proxy contract. |
|||

## Mutable fields of the Token Contract

The table below presents the mutable fields of the contract and their initial values.

| Name | Type | Initial Value |Description |
|--|--|--|--|
|`owner`| `ByStr20` | `init_owner` | Current `owner` of the contract. |
|`pauser`| `ByStr20` | `init_owner` | Current `pauser` in the contract. |
|`masterMinter`| `ByStr20` | `init_owner` | Current `masterMinter` in the contract.|
|`blacklister`| `ByStr20` | `init_owner` | Current `blacklister` in the contract.|
|`paused`| `Bool` | `False` | Keeps track of whether the contract is current paused or not. `True` means the contract is paused. |
