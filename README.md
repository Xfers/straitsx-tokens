# StraitsX SGD (XSGD)

## Token Description
The StraitsX SGD (XSGD) token is the first digital token fully collateralized one-for-one with Singapore Dollar (SGD) and representing 1 SGD. The XSGD token is written as a smart contract on Zilliqa's high-throughput decentralised public blockchain following the ZRC2 protocol and is governed by the StraitsX network whereby XSGD tokens are centrally minted and burned by Xfers Pte. Ltd. 

The Xfers payment service is regarded as a Widely Accepted Stored Value Facility under Singapore law. Xfers Pte. Ltd., is the Approved Holder of the Xfers Wallet Stored Value Facility.

https://www.xfers.com/

## Smart Contract Specifications
The XSGD contract has been written by the StraitsX team to fit both the specific needs of the XSGD token as described in the StraitsX Whitepaper and the requirement to comply with local regulation.

The XSGD contract consists of two communicating contracts:

a [token contract](https://github.com/Xfers/XSGD-scilla/blob/master/contracts/xsgd_contract.scilla)

a [proxy contract](https://github.com/Xfers/XSGD-scilla/blob/master/contracts/proxy.scilla)

The token contract represents a standard fungible token contract with minting and burning features, while the proxy contract is a typical relay contract that redirects all calls to the token contract. This allows upgrading the contract, as the original proxy can point to a newly deployed token contract.

### Token contract Roles and Privileges

| Name | Description & Privileges |
|--|--|
|`init_owner` | The initial owner of the contract which is usually the creator of the contract.  `init_owner` is the initial value of several other roles. |
|`owner` | Current owner of the contract initialized to `init_owner`. Certain critical actions can only be performed by the `owner`, e.g., changing who plays certain roles in the contract. |
|`pauser` | Account that is allowed to (un)pause the contract. It is initialized to `init_owner`.  `pauser` can (un) pause the contract. There is only `pauser` for the contract. |
|`masterMinter` | The master minter to manage the minters for the contract.  `masterMinter` can add or remove minters and configure the number of tokens that a minter is allowed to mint. There is only one `masterMinter` for the contract. |
| `minter` | An account that is allowed to mint and burn new tokens. The contract defines several minters. Each `minter` has a quota for minting new tokens. |
| `blacklister` | An account that can freeze, unfreeze & wipe the balance from any other account when required to do so by law enforcement. The presence of this function in the code is a mandatory regulatory requirement. StraitsX will never use this function on its own accord. There is only one `blacklister`. |
|`approvedSpender`| A token holder can designate a certain address to send up to a certain number of tokens on its behalf. These addresses will be called `approvedSpender`.  |
|`initiator`| The user who calls the proxy contract that in turns call the token contract. After deployment, the address of the token contract will be made known to the user and the code will be visible directly from the block explorer. |

### Immutable Parameters

The table below lists the parameters that are defined at the contract deployment time and hence cannot be changed later on.

| Name | Type | Description |
|--|--|--|
|`name`| `String` | A human readable token name. |
|`symbol`| `String` | A ticker symbol for the token. |
|`decimals`| `Uint32` | Defines the smallest unit of the tokens|
|`init_owner`| `ByStr20` | The initial owner of the contract. |
|`proxy_address` | `ByStr20` | Address of the proxy contract. |

### Mutable Fields

The table below presents the mutable fields of the contract and their initial values.

| Name | Type | Initial Value |Description |
|--|--|--|--|
|`owner`| `ByStr20` | `init_owner` | Current `owner` of the contract. |
|`pauser`| `ByStr20` | `init_owner` | Current `pauser` in the contract. |
|`masterMinter`| `ByStr20` | `init_owner` | Current `masterMinter` in the contract.|
|`blacklister`| `ByStr20` | `init_owner` | Current `blacklister` in the contract.|
|`paused`| `Bool` | `True` | Keeps track of whether the contract is current paused or not. `True` means the contract is paused. |
|`blacklisted`| `Map ByStr20 Uint128` | `Emp ByStr20 Uint128` | Records the addresses that are blacklisted. An address that is present in the map is blacklisted irrespective of the value it is mapped to. |
|`balances`| `Map ByStr20 Uint128` | `Emp ByStr20 Uint128` | Keeps track of the number of tokens that each token holder owns. |
|`allowed`| `Map ByStr20 (Map ByStr20 Uint128)` | `Emp ByStr20 (Map ByStr20 Uint128)` | Keeps track of the `approvedSpender` for each token holder and the number of tokens that she is allowed to spend on behalf of the token holder. |
|`totalSupply`| `Uint128`| `0` | The total number of tokens that is in the supply. |
|`minters`| `Map ByStr20 Uint128`| `Emp ByStr20 Uint128` | Maintains the current `minter`s. An address that is present in the map is a `minter` irrespective of the value it is mapped to.|
|`minterAllowed`| `Map ByStr20 Uint128` | `Emp ByStr20 Uint128` | Keeps track of the allowed number of tokens that a `minter` can mint. |

### Transitions

Note that each of the transitions in the token contract takes `initiator` as a parameter which as explained above is the caller that calls the proxy contract which in turn calls the token contract.

All the transitions in the contract can be categorized into three categories:
- _housekeeping transitions_ meant to facilitate basic admin related tasks.
- _pause_ transitions to pause and pause the contract.
- _minting-related transitions_ that allows mining and burning of tokens.
- _token transfer transitions_ allows to transfer tokens from one user to another.


Each of these category of transitions are presented in further details below:

#### HouseKeeping Transitions

| Name | Params | Description | Callable when paused? |
|--|--|--|--|
|`transferOwnership`|`newOwner : ByStr20, initiator : ByStr20`|Allows the current `owner` to transfer control of the contract to a `newOwner`. <br>  :warning: **Note:** `initiator` must be the current `owner` in the contract.  | :heavy_check_mark: |
|`updatePauser`| `newPauser : ByStr20, initiator : ByStr20` |  Replace the current `pauser` with the `newPauser`.  <br>  :warning: **Note:** `initiator` must be the current `owner` in the contract. | :heavy_check_mark: |
|`blacklist`|`address : ByStr20, initiator : ByStr20`| Blacklist a given address. A blacklisted address can neither send or receive tokens. A `minter` can also be blacklisted. <br> :warning: **Note:**   `initiator` must be the current `blacklister` in the contract.| :heavy_check_mark: |
|`unBlacklist`|`address : ByStr20, initiator : ByStr20`| Remove a given address from the blacklist.  <br> :warning: **Note:** `initiator` must be the current `blacklister` in the contract.| :heavy_check_mark: |
|`updateBlacklister`|`newBlacklister : ByStr20, initiator : ByStr20`| Replace the current `blacklister` with the `newBlacklister`.  <br> :warning: **Note:**  `initiator` must be the current `owner` in the contract.| :heavy_check_mark: |
|`updateMasterMinter`| `newMasterMinter : ByStr20, initiator : ByStr20` | Replace the current `masterMinter` with the `newMasterMinter`. <br> :warning: **Note:**  `initiator` must be the current `owner` in the contract. | :heavy_check_mark: |
|`configureMinter`| `minter : ByStr20, minterAllowedAmount : Uint128, initiator : ByStr20` | Add a new `minter` or update the minting quota for an existing minter. <br> :warning: **Note:**  `initiator` must be the current `masterMinter` in the contract. | :x: |
|`removeMinter`| `minter : ByStr20, initiator : ByStr20` | Remove a given minter. <br> :warning: **Note:**  `initiator` must be the current `masterMinter` in the contract. | :heavy_check_mark: |

#### Pause Transitions

| Name | Params | Description | Callable when paused? |
|--|--|--|--|
|`pause`| `initiator : ByStr20` | Pause the contract to temporarily stop all transfer of tokens and other operations. Only the current `pauser` can invoke this transition.  <br>  :warning: **Note:** `initiator` must be the current `pauser` in the contract.  | :heavy_check_mark: |
|`unpause`| `initiator : ByStr20` | Unpause the contract to re-allow all transfer of tokens and other operations. Only the current `pauser` can invoke this transition.  <br>  :warning: **Note:** `initiator` must be the current `pauser` in the contract.  | :heavy_check_mark: |

#### Minting-related Transitions

| Name | Params | Description | Callable when paused? |
|--|--|--|--|
|`mint`| `to: ByStr20, value : Uint128, initiator : ByStr20` | Mint `value` number of new tokens and allocate them to the `to` address.  <br>  :warning: **Note:** 1) Minting is a privileged transition that can be invoked only by non-blacklisted minters, i.e., `initiator` must be a non-blacklisted `minter`. , 2) Minting can only be done when the contract is not paused. | <center>:x:</center> |
|`burn`| `value : Uint128, initiator : ByStr20` | Burn `value` number of tokens.  <br>  :warning: **Note:**   1) Burning is a privileged transition that can be invoked only by non-blacklisted minters, i.e., `initiator` must be a non-blacklisted `minter`. 2) Burning can only be done when the contract is not paused.| <center>:x:</center>  |
|`lawEnforcementWipingBurn`| `address : ByStr20, initiator : ByStr20` | Burn entire balance of tokens from `address`.  <br>  :warning: **Note:**   1) Only the blacklister can invoke this transition, i.e., `initiator` must be the `blacklister`. 2) Burning can only be done when the contract is not paused. 3) Only accounts that have been blacklisted by the blacklister may have their funds wiped.| <center>:x:</center>  |


#### Token Transfer Transitions

| Name | Params | Description | Callable when paused? |
|--|--|--|--|
|`approve`| `spender : ByStr20, value : Uint128, initiator : ByStr20` | Approve a `spender` to spend on behalf of a token holder (`initiator`) upto the `value` amount. <br> :warning: **Note:** 1) Only the non-blacklisted minters can invoke this transition, i.e., `initiator` must be a non-blacklisted token holder, 2) The spender must also be non-blacklisted. | <center>:x:</center>  |
|`transfer`| `to : ByStr20, value : Uint128, initiator : ByStr20` | Transfer `value` number of tokens from the `initiator` to the `to` address.  <br>  :warning: **Note:**   1) The `initiator` and the `recipient` should not be blacklisted.|<center>:x:</center>  |
|`transferFrom`| `from : ByStr20, to : ByStr20, value : Uint128, initiator : ByStr20` | Transfer `value` number of tokens on behalf of the `initiator` to the `to` address.  <br>  :warning: **Note:**   1) The `initiator`, the `from` address and the `recipient` should not be blacklisted.|<center>:x:</center>  |

## Proxy Contract

Proxy contract is a relay contract that redirects calls to it to the token contract.

### Proxy contract Roles and Privileges


| Name | Description & Privileges |
|--|--|
|`init_admin` | The initial admin of the contract which is usually the creator of the contract.  `init_admin` is also the initial value of `admin`. |
|`admin` | Current `admin` of the contract initialized to `init_admin`. Certain critical actions can only be performed by the `admin`, e.g., changing the current implementation of the token contract. |
|`initiator`| The user who calls the proxy contract that in turns call the token contract. After deployment, the address of the proxy contract will be made known to the user and the code will be visible directly from the block explorer. |

### Immutable Parameters

The table below list the parameters that are defined at the contrat deployment time and hence cannot be changed later on.

| Name | Type | Description |
|--|--|--|
|`init_implementation`| `ByStr20` | The address of the token contract. |
|`init_admin`| `ByStr20` | The address of the admin. |


### Mutable Fields

The table below presents the mutable fields of the contract and their initial values.

| Name | Type | Initial Value |Description |
|--|--|--|--|
|`implementation`| `ByStr20` | `init_implementation` | Address of the current implementation of the token contract. |
|`admin`| `ByStr20` | `init_owner` | Current `admin` in the contract. |

### Transitions

All the transitions in the contract can be categorized into two categories:
- _housekeeping transitions_ meant to facilitate basic admin related tasks.
- _relay_ transitions to redirect calls to the token contract.

#### Housekeeping Transitions

| Name | Params | Description |
|--|--|--|
|`upgradeTo`| `newImplementation : ByStr20` |  Change the current implementation address of the token contract. <br> :warning: **Note:** Only the `admin` can invoke this transition|
|`changeAdmin`| `newAdmin : ByStr20` |  Change the current `admin` of the contract. <br> :warning: **Note:** Only the `admin` can invoke this transition|


#### Relay Transitions

Note that these transitions are just meant to redirect calls to the corresponding token contract and hence their names have an added prefix `proxy`. While, redirecting the contract prepares the `initiator` value that is the address of the caller of the proxy contract.

| Transition signature in the proxy contract  | Target transition in the token contract |
|--|--|
|`proxyTransferOwnership(newOwner : ByStr20)` | `transferOwnership(newOwner : ByStr20, initiator : ByStr20)` |
|`proxyPause()` | `pause(initiator : ByStr20)` |
|`proxyUnPause()` | `unpause(initiator : ByStr20)` |
|`proxyUpdatePauser(newPauser : ByStr20)` | `updatePauser(newPauser : ByStr20, initiator : ByStr20)` |
|`proxyBlacklist(address : ByStr20)` | `blacklist(address : ByStr20, initiator : ByStr20)` |
|`proxyUnBlacklist(address : ByStr20)` | `unBlacklist(address : ByStr20, initiator : ByStr20)` |
|`proxyUpdateBlacklister(newBlacklister : ByStr20)` | `updateBlacklister(newBlacklister : ByStr20, initiator : ByStr20)` |
|`proxyConfigureMinter(minter : ByStr20, minterAllowedAmount : Uint128)` | `configureMinter(minter : ByStr20, minterAllowedAmount : Uint128, initiator : ByStr20)` |
|`proxyRemoveMinter(minter : ByStr20)` | `removeMinter(minter : ByStr20, initiator : ByStr20)` |
|`proxyUpdateMasterMinter(newMasterMinter : ByStr20)` | `updateMasterMinter(newMasterMinter : ByStr20, initiator : ByStr20)` |
|`proxyMint(to: ByStr20, value : Uint128)` | `mint(to: ByStr20, value : Uint128, initiator : ByStr20)` |
|`proxyBurn(value : Uint128)` | `burn(value : Uint128, initiator : ByStr20)` |
|`proxyLawEnforcementWipingBurn(address : ByStr20)` | `lawEnforcementWipingBurn(address : ByStr20, initiator : ByStr20)` |
|`proxyApprove(spender : ByStr20, value : Uint128)` | `approve(spender : ByStr20, value : Uint128, initiator : ByStr20)` |
|`proxyTransferFrom (from : ByStr20, to : ByStr20, value : Uint128)` | `transferFrom (from : ByStr20, to : ByStr20, value : Uint128, initiator : ByStr20)` |

