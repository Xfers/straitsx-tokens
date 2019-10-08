# Xfers SGDX Stable Coin

The SGDX stablecoin consists of two communicating contracts namely a [token contract](https://github.com/AmritKumar/xfers-contracts/blob/master/contracts/sgdx_contract.scilla) and a [proxy contract](https://github.com/AmritKumar/xfers-contracts/blob/master/contracts/proxy.scilla). The token contract represents a standard fungible token contract with minting and burning features, while the proxy contract is a typical relay contract that redirects all calls to the token contract. The purpose of the proxy contract is to allow upgradeability of the token contract in scenarios where the token contract is found to contain bugs.


## Token Contract

### Roles and Privileges

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
|`initiator`| The user who calls the proxy contract that in turns call the token contract. |

### Immutable Parameters

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


### Mutable Fields

The table below presents the mutable fields of the contract and their initial values.

| Name | Type | Initial Value |Description |
|--|--|--|--|
|`owner`| `ByStr20` | `init_owner` | Current `owner` of the contract. |
|`pauser`| `ByStr20` | `init_owner` | Current `pauser` in the contract. |
|`masterMinter`| `ByStr20` | `init_owner` | Current `masterMinter` in the contract.|
|`blacklister`| `ByStr20` | `init_owner` | Current `blacklister` in the contract.|
|`paused`| `Bool` | `False` | Keeps track of whether the contract is current paused or not. `True` means the contract is paused. |
|`blacklisted`| `Map ByStr20 Uint128` | `Emp ByStr20 Uint128` | Records the addresses that are blacklisted. An address that is present in the map is blacklisted irrespective of the value it is mapped to. |
|`revokedDefaultOperators`| `Map ByStr20 (Map ByStr20 Bool)` | `Emp ByStr20 (Map ByStr20 Bool)` | Records the default operators that have been revoked for each token holder. The first key (outermost) in the map is the token holder, while the second key (innermost) in the map is the address of the default operator. A default operator that is present in the map is revoked irrespective of the value it is mapped to. |
|`balances`| `Map ByStr20 Uint128` | `Emp ByStr20 Uint128` | Keeps track of the number of tokens that each token holder owns. |
|`allowed`| `Map ByStr20 (Map ByStr20 Uint128)` | `Emp ByStr20 (Map ByStr20 Uint128)` | Keeps track of the `approvedSpender` for each token holder and the number of tokens that she is allowed to spend on behalf of the token holder. |
|`totalSupply`| `Uint128`| `0` | The total number of tokens that is in the supply. | 
|`minters`| `Map ByStr20 Uint128`| `Emp ByStr20 Uint128` | Maintains the current `minter`s. An address that is present in the map is a `minter` irrespective of the value it is mapped to.| 
|`minterAllowed`| `Map ByStr20 Uint128` | `Emp ByStr20 Uint128` | Keeps track of the allowed number of tokens that a `minter` can mint. |

### Transitions

Note that each of the transitions in the token contract takes `initiator` as a parameter which as explained above is the caller that calls the proxy contract which in turn calls the token contract. 

All the transitions in the contract can be categorized into three categories:
- _housekeeping transitions_ meant to facilitate basic admin realted tasks. 
- _pause_ transitions to pause and pause the contract.
- _minting-related transitions_ that allows mining and burning of tokens.
- _token transfer transitions_ allows to transfer tokens from one user to another.


Each of these category of transitions are presented in further details below:

#### HouseKeeping Transitions


| Name | Params | Description | Functions when paused? |
|--|--|--|--|
|`reauthorizeDefaultOperator`| `operator : ByStr20, initiator : ByStr20` |  Re-authorize the default `operator` to send tokens on behalf of the `initiator`. | :heavy_check_mark: |
|`revokeDefaultOperator`| `operator : ByStr20, initiator : ByStr20` | Revoke a default `operator` for the `initiator`. Post this call, the default `operator` will not be able to send tokens on behalf of the `initiator` | :heavy_check_mark: |
|`transferOwnership`|`newOwner : ByStr20, initiator : ByStr20`|Allows the current `owner` to transfer control of the contract to a `newOwner`. <br>  :warning: **Note:** `initiator` must be the current `owner` in the contract.  | :heavy_check_mark: |
|`updatePauser`| `newPauser : ByStr20, initiator : ByStr20` |  Replace the current `pauser` with the `newPauser`.  <br>  :warning: **Note:** `initiator` must be the current `owner` in the contract. | :heavy_check_mark: |
|`blacklist`|`address : ByStr20, initiator : ByStr20`| Blacklist a given address. A blacklisted address can neither send or receive tokens. A `minter` can also be blacklisted. <br> :warning: **Note:**   `initiator` must be the current `blacklister` in the contract.| :heavy_check_mark: |
|`unBlacklist`|`address : ByStr20, initiator : ByStr20`| Remove a given address from the blacklist.  <br> :warning: **Note:** `initiator` must be the current `blacklister` in the contract.| :heavy_check_mark: |
|`updateBlacklister`|`newBlacklister : ByStr20, initiator : ByStr20`| Replace the current `blacklister` with the `newBlacklister`.  <br> :warning: **Note:**  `initiator` must be the current `owner` in the contract.| :heavy_check_mark: |
|`updateMasterMinter`| `newMasterMinter : ByStr20, initiator : ByStr20` | Replace the current `masterMinter` with the `newMasterMinter`. <br> :warning: **Note:**  `initiator` must be the current `owner` in the contract. | :heavy_check_mark: |
|`configureMinter`| `minter : ByStr20, minterAllowedAmount : Uint128, initiator : ByStr20` | Add a new `minter` or update the minting quota for an existing minter. <br> :warning: **Note:**  `initiator` must be the current `masterMinter` in the contract. | :x: |
|`removeMinter`| `minter : ByStr20, initiator : ByStr20` | Remove a given minter. <br> :warning: **Note:**  `initiator` must be the current `masterMinter` in the contract. | :heavy_check_mark: |

#### Pause Transitions

| Name | Params | Description | Functions when paused? |
|--|--|--|--|
|`pause`| `initiator : ByStr20` | Pause the contract to temporarily stop all transfer of tokens and other operations. Only the current `pauser` can invoke this transition.  <br>  :warning: **Note:** `initiator` must be the current `pauser` in the contract.  | :heavy_check_mark: |
|`unpause`| `initiator : ByStr20` | Unpause the contract to re-allow all transfer of tokens and other operations. Only the current `pauser` can invoke this transition.  <br>  :warning: **Note:** `initiator` must be the current `pauser` in the contract.  | :heavy_check_mark: |

#### Minting-related Transitions

| Name | Params | Description | Functions when paused? |
|--|--|--|--|
|`mint`| `to: ByStr20, value : Uint128, initiator : ByStr20` | Mint `value` number of new tokens and allocate them to the `to` address.  <br>  :warning: **Note:** 1) Only the non-blacklisted token holders can invoke this transition, i.e., `initiator` must be a non-blacklisted `tokenHolder`, 2) Minting can only be done when the contract is not paused. | <center>:x:</center> |
|`burn`| `value : Uint128, initiator : ByStr20` | Burn `value` number of tokens.  <br>  :warning: **Note:**   1) Only the non-blacklisted minters can invoke this transition, i.e., `initiator` must be a non-blacklisted `minter`. 2) Burning can only be done when the contract is not paused.| <center>:x:</center>  |


#### Token Transfer Transitions

| Name | Params | Description | Functions when paused? |
|--|--|--|--|
|`approve`| `spender : ByStr20, value : Uint128, initiator : ByStr20` | Approve a `spender` to spend on behalf of a token holder (`initiator`) upto the `value` amount. <br> :warning: **Note:** 1) Only the non-blacklisted minters can invoke this transition, i.e., `initiator` must be a non-blacklisted token holder, 2) The spender must also be non-blacklisted. | <center>:x:</center>  |
|`transfer`| `to : ByStr20, value : Uint128, initiator : ByStr20` | Transfer `value` number of tokens from the `initiator` to the `to` address.  <br>  :warning: **Note:**   1) The `initiator` and the `recipient` should not be blacklisted.|<center>:x:</center>  |
|`transferFrom`| `from : ByStr20, to : ByStr20, value : Uint128, initiator : ByStr20` | Transfer `value` number of tokens on behalf of the `initiator` to the `to` address.  <br>  :warning: **Note:**   1) The `initiator`, the `from` address and the `recipient` should not be blacklisted.|<center>:x:</center>  |
|`operatorSend`| `from : ByStr20, to : ByStr20, value : Uint128, initiator : ByStr20` | A transition for default operators to send tokens on behalf of a `from` address.  <br>  :warning: **Note:**   1) Only non-revoked default operators can invoke this transition. 2) Default operators can transfer any amount on behalf of a token holder. 3) The `initiator`, the `from` address and the `recipient` should not be blacklisted.| <center> :x: </center> |

