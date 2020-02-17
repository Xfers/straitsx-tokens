# StraitsX SGD (XSGD)

## Token Description
The StraitsX SGD (XSGD) token is the first digital token fully collateralized one-for-one with Singapore Dollar (SGD) and representing 1 SGD. The XSGD token is written as a smart contract on Zilliqa's high-throughput decentralised public blockchain following the ZRC2 protocol and is governed by the StraitsX network whereby XSGD tokens are centrally minted and burned by Xfers Pte. Ltd. 

The Xfers payment service is regarded as a Widely Accepted Stored Value Facility under Singapore law. Xfers Pte. Ltd., is the Approved Holder of the Xfers Wallet Stored Value Facility.

https://www.xfers.com/

## Smart Contract Specifications
The XSGD contract has been written by the StraitsX team to fit both the specific needs of the XSGD token as described in the StraitsX Whitepaper and the requirement to comply with local regulation.

The XSGD contract consists of two communicating contracts:
- [token contract](https://github.com/Xfers/XSGD-scilla/blob/master/contracts/xsgd_contract.scilla)
- [proxy contract](https://github.com/Xfers/XSGD-scilla/blob/master/contracts/proxy.scilla)

The token contract represents a standard fungible token contract with minting and burning features, while the proxy contract is a typical relay contract that redirects all calls to the token contract. This allows upgrading the contract, as the original proxy can point to a newly deployed token contract.

And one multi-signature contract:
- [multi-signature contract](https://github.com/Xfers/XSGD-scilla/blob/master/contracts/wallet.scilla)

The multi-signature contract is a digital signature scheme which allows a group of users(owners) to submit, sign and execute transactions in proxy contract.

### Token contract Roles and Privileges

| Name | Description & Privileges |
|--|--|
|`init_owner`| The initial owner of the contract which is usually the creator of the contract. `init_owner` is the initial value of several other roles. |
|`owner`| Current owner of the contract initialized to `init_owner`. Certain critical actions can only be performed by the `owner`, e.g., changing who plays certain roles in the contract. |
|`pauser`| Account that is allowed to (un)pause the contract. It is initialized to `init_owner`. `pauser` can (un) pause the contract. There is only `pauser` for the contract. |
|`masterMinter`| The master minter to manage the minters for the contract.  `masterMinter` can add or remove minters and configure the number of tokens that a minter is allowed to mint. There is only one `masterMinter` for the contract. |
|`minter`| An account that is allowed to mint and burn new tokens. The contract defines several minters. Each `minter` has a quota for minting new tokens. |
|`blacklister`| An account that can freeze, unfreeze & wipe the balance from any other account when required to do so by law enforcement. The presence of this function in the code is a mandatory regulatory requirement. StraitsX will never use this function on its own accord. There is only one `blacklister`. |
|`spender`| A token holder can designate a certain address to send up to a certain number of tokens on its behalf. These addresses will be called `spender`.  |
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
|`paused`| `Bool` | `True` | Keeps track of whether the contract is current paused or not. `True` means the contract is paused. |
|`blacklister`| `ByStr20` | `init_owner` | Current `blacklister` in the contract.|
|`blacklisted`| `Map ByStr20 Uint128` | `Emp ByStr20 Uint128` | Records the addresses that are blacklisted. An address that is present in the map is blacklisted irrespective of the value it is mapped to. |
|`allowed`| `Map ByStr20 (Map ByStr20 Uint128)` | `Emp ByStr20 (Map ByStr20 Uint128)` | Keeps track of the `Spender` for each token holder and the number of tokens that she is allowed to spend on behalf of the token holder. |
|`minterAllowed`| `Map ByStr20 Uint128` | `Emp ByStr20 Uint128` | Keeps track of the allowed number of tokens that a `minter` can mint. |

### Transitions

Note that each of the transitions in the token contract takes `initiator` as a parameter which as explained above is the caller that calls the proxy contract which in turn calls the token contract.

All the transitions in the contract can be categorized into three categories:
- _housekeeping transitions_ meant to facilitate basic admin related tasks.
- _pause transitions_ to pause and pause the contract.
- _minting-related transitions_ that allows mining and burning of tokens.
- _token transfer transitions_ allows to transfer tokens from one user to another.


Each of these category of transitions are presented in further details below:

#### HouseKeeping Transitions

| Name | Params | Description | Callable when paused? |
|--|--|--|--|
|`transferOwnership`|`newOwner : ByStr20, initiator : ByStr20`| Allows the current `owner` to transfer control of the contract to a `newOwner`. <br> :warning: **Note:** `initiator` must be the current `owner` in the contract. | :heavy_check_mark: |
|`updatePauser`| `newPauser : ByStr20, initiator : ByStr20` | Replace the current `pauser` with the `newPauser`. <br> :warning: **Note:** `initiator` must be the current `owner` in the contract. | :heavy_check_mark: |
|`blacklist`|`address : ByStr20, initiator : ByStr20`| Blacklist a given address. A blacklisted address can neither send or receive tokens. A `minter` can also be blacklisted. <br> :warning: **Note:**   `initiator` must be the current `blacklister` in the contract. | :heavy_check_mark: |
|`unBlacklist`|`address : ByStr20, initiator : ByStr20`| Remove a given address from the blacklist. <br> :warning: **Note:** `initiator` must be the current `blacklister` in the contract. | :heavy_check_mark: |
|`updateBlacklister`|`newBlacklister : ByStr20, initiator : ByStr20`| Replace the current `blacklister` with the `newBlacklister`. <br> :warning: **Note:**  `initiator` must be the current `owner` in the contract. | :heavy_check_mark: |
|`updateMasterMinter`| `newMasterMinter : ByStr20, initiator : ByStr20` | Replace the current `masterMinter` with the `newMasterMinter`. <br> :warning: **Note:**  `initiator` must be the current `owner` in the contract. | :heavy_check_mark: |
|`increaseMinterAllowance`| `minter : ByStr20, amount : Uint128, initiator : ByStr20` | Increase the number of tokens that a `minter` is allowed to mint. <br> :warning: **Note:**  `initiator` must be the current `masterMinter` in the contract. | :heavy_check_mark: |
|`decreaseMinterAllowance`| `minter : ByStr20, amount : Uint128, initiator : ByStr20` | Decrease the number of tokens that a `minter` is allowed to mint. <br> :warning: **Note:**  `initiator` must be the current `masterMinter` in the contract. | :heavy_check_mark: |

#### Pause Transitions

| Name | Params | Description | Callable when paused? |
|--|--|--|--|
|`pause`| `initiator : ByStr20` | Pause the contract to temporarily stop all transfer of tokens and other operations. Only the current `pauser` can invoke this transition.  <br>  :warning: **Note:** `initiator` must be the current `pauser` in the contract.  | :heavy_check_mark: |
|`unpause`| `initiator : ByStr20` | Unpause the contract to re-allow all transfer of tokens and other operations. Only the current `pauser` can invoke this transition.  <br>  :warning: **Note:** `initiator` must be the current `pauser` in the contract.  | :heavy_check_mark: |

#### Minting-related Transitions

| Name | Params | Description | Callable when paused? |
|--|--|--|--|
|`mint`| `to: ByStr20, value : Uint128, initiator : ByStr20, to_bal : Uint128, current_supply : Uint128` | Mint `value` number of new tokens and allocate them to the `to` address.  <br>  :warning: **Note:** 1) Minting is a privileged transition that can be invoked only by non-blacklisted minters, i.e., `initiator` must be a non-blacklisted `minter`. , 2) Minting can only be done when the contract is not paused. | <center>:x:</center> |
|`burn`| `value : Uint128, initiator : ByStr20, initiator_balance : Uint128, current_supply : Uint128` | Burn `value` number of tokens.  <br>  :warning: **Note:**   1) Burning is a privileged transition that can be invoked only by non-blacklisted minters, i.e., `initiator` must be a non-blacklisted `minter`. 2) Burning can only be done when the contract is not paused.| <center>:x:</center>  |
|`lawEnforcementWipingBurn`| `address : ByStr20, initiator : ByStr20` | Burn entire balance of tokens from `address`.  <br>  :warning: **Note:**   1) Only the blacklister can invoke this transition, i.e., `initiator` must be the `blacklister`. 2) Burning can only be done when the contract is not paused. 3) Only accounts that have been blacklisted by the blacklister may have their funds wiped.| <center>:x:</center>  |

#### Token Transfer Transitions

| Name | Params | Description | Callable when paused? |
|--|--|--|--|
|`increaseAllowance`| `spender : ByStr20, value : Uint128, initiator : ByStr20` | Increase `value` amount of a `spender` to spend on behalf of a token holder (`initiator`) . <br> :warning: **Note:** 1) Only the non-blacklisted minters can invoke this transition, i.e., `initiator` must be a non-blacklisted token holder, 2) The spender must also be non-blacklisted. | <center>:x:</center>  |
|`decreaseAllowance`| `spender : ByStr20, value : Uint128, initiator : ByStr20` | Decrease `value` amount of a `spender` to spend on behalf of a token holder (`initiator`) . <br> :warning: **Note:** 1) Only the non-blacklisted minters can invoke this transition, i.e., `initiator` must be a non-blacklisted token holder, 2) The spender must also be non-blacklisted. | <center>:x:</center>  |
|`transfer`| `to : ByStr20, value : Uint128, initiator : ByStr20, to_bal : Uint128, init_bal : Uint128` | Transfer `value` number of tokens from the `initiator` to the `to` address.  <br>  :warning: **Note:**   1) The `initiator` and the `recipient` should not be blacklisted.|<center>:x:</center>  |
|`transferFrom`| `from : ByStr20, to : ByStr20, value : Uint128, initiator : ByStr20, to_bal : Uint128, from_bal : Uint128` | Transfer `value` number of tokens on behalf of the `initiator` to the `to` address.  <br>  :warning: **Note:**   1) The `initiator`, the `from` address and the `recipient` should not be blacklisted.|<center>:x:</center>  |

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
|`balances`| `Map ByStr20 Uint128` | `Emp ByStr20 Uint128` | Keeps track of the number of tokens that each token holder owns. |
|`totalSupply`| `Uint128` | `0` | The total number of tokens that is in the supply. |

### Transitions

All the transitions in the contract can be categorized into three categories:
- _housekeeping transitions_ meant to facilitate basic admin related tasks.
- _relay transitions_ to redirect calls to the token contract.
- _callback transitions_ are called by the token contract for updating fields in proxy contract.

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
|`proxyMint(to: ByStr20, value : Uint128)` | `mint(to: ByStr20, value : Uint128, initiator : ByStr20, to_bal : Uint128, current_supply : Uint128)` |
|`proxyIncreaseAllowance(spender : ByStr20, value : Uint128)` | `increaseAllowance(spender: ByStr20, value : Uint128, initiator : ByStr20)` |
|`proxyDecreaseAllowance(spender : ByStr20, value : Uint128)` | `decreaseAllowance(spender: ByStr20, value : Uint128, initiator : ByStr20)` |
|`proxyTransferFrom(from : ByStr20, to : ByStr20, value : Uint128)` | `transferFrom(from : ByStr20, to : ByStr20, value : Uint128, initiator : ByStr20, to_bal : Uint128, from_bal : Uint128)` |
|`proxyTransfer(to : ByStr20, value : Uint128)` | `transfer(to : ByStr20, value : Uint128, initiator : ByStr20, to_bal : Uint128, init_bal : Uint128)` |
|`proxyBurn(value : Uint128)` | `burn(value : Uint128, initiator : ByStr20, initiator_balance : Uint128, current_supply : Uint128)` |
|`proxyLawEnforcementWipingBurn(address : ByStr20)` | `lawEnforcementWipingBurn(address : ByStr20, initiator : ByStr20, addr_bal : Uint128, current_supply : Uint128)` |
|`proxyIncreaseMinterAllowance(minter : ByStr20, amount : Uint128)` | `increaseMinterAllowance(minter : ByStr20, amount : Uint128, initiator : ByStr20)` |
|`proxyDecreaseMinterAllowance(minter : ByStr20, amount : Uint128)` | `decreaseMinterAllowance(minter : ByStr20, amount : Uint128, initiator : ByStr20)` |
|`proxyUpdateMasterMinter(newMasterMinter : ByStr20)` | `updateMasterMinter(newMasterMinter : ByStr20, initiator : ByStr20)` |

#### Callback Transitions

| Callback transition in the proxy contract  | Source transition in the token contract |
|--|--|
|`mintCallBack(to : ByStr20, new_to_bal : Uint128, new_supply : Uint128)` | `mint(to: ByStr20, value : Uint128, initiator : ByStr20, to_bal : Uint128, current_supply : Uint128)` |
|`transferFromCallBack(from : ByStr20, to : ByStr20, new_from_bal : Uint128, new_to_bal : Uint128)` | `transferFrom(from : ByStr20, to : ByStr20, value : Uint128, initiator : ByStr20, to_bal : Uint128, from_bal : Uint128)` |
|`transferCallBack(to : ByStr20, initiator : ByStr20, new_to_bal : Uint128, new_init_bal : Uint128)` | `transfer(to : ByStr20, value : Uint128, initiator : ByStr20, to_bal : Uint128, init_bal : Uint128)` |
|`burnCallBack(initiator : ByStr20, new_burn_balance : Uint128, new_supply : Uint128)` | `burn(value : Uint128, initiator : ByStr20, initiator_balance : Uint128, current_supply : Uint128)` |
|`lawEnforcementWipingBurnCallBack(address : ByStr20, new_supply : Uint128)` | `lawEnforcementWipingBurn(address : ByStr20, initiator : ByStr20, addr_bal : Uint128, current_supply : Uint128)` |

## Multi-signature Contract

This contract holds funds that can be paid out to arbitrary users, provided that enough people in the collection of owners sign off on the payout.

The transaction must be added to the contract before signatures can be collected. Once enough signatures are collected, the recipient can ask for the transaction to be executed and the money paid out.

If an owner changes his mind about a transaction, the signature can be revoked until the transaction is executed.

This wallet does not allow adding or removing owners, or changing the number of required signatures. To do any of those things, perform the following steps:
1. Deploy a new wallet with `owners` and `required_signatures` set to the new values. `MAKE SURE THAT THE NEW WALLET HAS BEEN SUCCESFULLY DEPLOYED WITH THE CORRECT PARAMETERS BEFORE CONTINUING!`
2. Invoke the SubmitTransaction transition on the old wallet with the following parameters:
   - `recipient` : The `address` of the new wallet
   - `amount` : The `_balance` of the old wallet
   - `tag` : `AddFunds`
3. Have (a sufficient number of) the owners of the old contract invoke the `SignTransaction` transition on the old wallet. The parameter `transactionId` should be set to the `Id` of the transaction created in step 2.
4. Have one of the owners of the old contract invoke the `ExecuteTransaction` transition on the old contract. This will cause the entire balance of the old contract to be transferred to the new wallet. Note that no un-executed transactions will be transferred to the new wallet along with the funds.

WARNING:

If a sufficient number of owners lose their private keys, or for any other reason are unable or unwilling to sign for new transactions, the funds in the wallet will be locked forever. It is therefore a good idea to set required_signatures to a value strictly less than the number of owners, so that the remaining owners can retrieve the funds should such a scenario occur.

If an owner loses his private key, the remaining owners should move the funds to a new wallet (using the workflow described above) to  ensure that funds are not locked if another owner loses his private key. The owner who originally lost his private key can generate a new key, and the corresponding address be added to the new wallet, so that the same set of persons own the new wallet.

### Multi-signature contract Roles and Privileges

| Name | Description & Privileges |
|--|--|
|`owners` | The users who own this contract. |
|`initiator`| The user who calls the multi-signature contract. |

### Immutable Parameters

The table below lists the parameters that are defined at the contract deployment time and hence cannot be changed later on.

| Name | Type | Description |
|--|--|--|
|`owners_list`| `List ByStr20` | List of init owners. |
|`required_signatures`| `Uint32` | Minimum amount of signatures to execute a transaction. |

### Mutable Fields

The table below presents the mutable fields of the contract and their initial values.

| Name | Type | Initial Value | Description |
|--|--|--|--|
|`owners`| `Map ByStr20 Bool` | `mk_owners_map owners_list` | Map of owners. |
|`transactionCount`| `Uint32` | `0` | The count of transactions have been executed by this contract. |
|`signatures`| `Map Uint32 (Map ByStr20 Bool)` | `Emp Uint32 (Map ByStr20 Bool)` | Collected signatures for transactions by transaction ID. |
|`signature_counts`| `Map Uint32 Uint32` | `Emp Uint32 Uint32` | Running count of collected signatures for transactions. |
|`transactions`| `Map Uint32 Transaction` | `Emp Uint32 Transaction` | Transactions have been submitted but not exected yet. |

### Transitions

All the transitions in the contract can be categorized into three categories:
- _submit transitions_ create transactions for future signoff.
- _action transitions_ let owners sign, revoke or execute submitted transactions.
- _callback transitions_ are called by the proxy contract. No action required, but must be defined, since to the wallet will fail otherwise.
- `AddFunds transition` are use for adding native funds(ZIL) to the wallet.

#### Submit Transitions

| Name | Params | Description |
|--|--|--|
|`SubmitNativeTransaction`| `recipient : ByStr20, amount : Uint128, tag : String` | Submit a transaction of native tokens for future signoff |
|`SubmitCustomTransferOwnershipTransaction`| `proxyTokenContract : ByStr20, newOwner : ByStr20` | Submit a new `TransferOwnership` transaction for future signoff |
|`SubmitCustomUpdatePauserTransaction`| `proxyTokenContract : ByStr20, newPauser : ByStr20` | Submit a new `UpdatePauser` transaction for future signoff |
|`SubmitCustomBlacklistTransaction`| `proxyTokenContract : ByStr20, address : ByStr20` | Submit a new `Blacklist` transaction for future signoff |
|`SubmitCustomUnBlacklistTransaction`| `proxyTokenContract : ByStr20, address : ByStr20` | Submit a new `UnBlacklist` transaction for future signoff |
|`SubmitCustomUpdateBlacklisterTransaction`| `proxyTokenContract : ByStr20, newBlacklister : ByStr20` | Submit a new `UpdateBlacklister` transaction for future signoff |
|`SubmitCustomLawEnforcementWipingBurnTransaction`| `proxyTokenContract : ByStr20, address : ByStr20` | Submit a new `LawEnforcementWipingBurn` transaction for future signoff |
|`SubmitCustomBurnTransaction`| `proxyTokenContract : ByStr20, value : Uint128` | Submit a new `Burn` transaction for future signoff |
|`SubmitCustomMintTransaction`| `proxyTokenContract : ByStr20, to : ByStr20, value : Uint128` | Submit a new `Mint` transaction for future signoff |
|`SubmitCustomTransferTransaction`| `proxyTokenContract : ByStr20, to : ByStr20, value : Uint128` | Submit a new `Transfer` transaction for future signoff |
|`SubmitCustomTransferFromTransaction`| `proxyTokenContract : ByStr20, from : ByStr20, to : ByStr20, value : Uint128` | Submit a new `TransferFrom` transaction for future signoff |
|`SubmitCustomUpdateMasterMinterTransaction`| `proxyTokenContract : ByStr20, newMasterMinter : ByStr20` | Submit a new `UpdateMasterMinter` transaction for future signoff |
|`SubmitCustomIncreaseMinterAllowanceTransaction`| `proxyTokenContract : ByStr20, minter : ByStr20, amount : Uint128` | Submit a new `IncreaseMinterAllowance` transaction for future signoff |
|`SubmitCustomDecreaseMinterAllowanceTransaction`| `roxyTokenContract : ByStr20, minter : ByStr20, amount : Uint128` | Submit a new `DecreaseMinterAllowance` transaction for future signoff |
|`SubmitCustomPauseTransaction`| `proxyTokenContract : ByStr20` | Submit a new `Pause` transaction for future signoff |
|`SubmitCustomUnPauseTransaction`| `proxyTokenContract : ByStr20` | Submit a new `UnPause` transaction for future signoff |
|`SubmitCustomProxyUpgradeToTransaction`| `proxyTokenContract : ByStr20, newImplementation : ByStr20` | Submit a new `UpgradeTo` transaction for future signoff |
|`SubmitCustomProxyChangeAdminTransaction`| `proxyTokenContract : ByStr20, newAdmin : ByStr20` | Submit a new `ChangeAdmin` transaction for future signoff |

#### Action Transitions

| Name | Params | Description |
|--|--|--|
|`SignTransaction`| `transactionId : Uint32` | Sign off on an existing transaction. |
|`RevokeSignature`| `transactionId : Uint32` | Revoke signature of existing transaction, if it has not yet been executed. |
|`ExecuteTransaction`| `transactionId : Uint32` | Execute signed-off transaction. |

#### Callback Transitions

All the callback transitions can be categorized into two categories:
- _acceptance callback transitions_ will be called when this multi-signature contact is the `recipient` of the transaction.
- _initiator callback transitions_ will be called when this multi-signature contact is the `initiator` of the transaction.

**Acceptance Callback Transitions**

| Name | Params |
|--|--|
|`RecipientAcceptTransfer`| `sender : ByStr20, recipient : ByStr20, amount : Uint128` |
|`RecipientAcceptTransferFrom`| `sender : ByStr20, recipient : ByStr20, amount : Uint128` |
|`RecipientAcceptMint`| `recipient : ByStr20, amount : Uint128` |

**Initiator Callback Transitions**

| Name | Params |
|--|--|
|`TransferSuccessCallBack`| `sender : ByStr20, recipient : ByStr20, amount : Uint128` |
|`TransferFromSuccessCallBack`| `sender : ByStr20, recipient : ByStr20, amount : Uint128` |
|`MintSuccessCallBack`| `recipient : ByStr20, amount : Uint128` |
|`LawEnforcementWipingBurnSuccessCallBack`| `address : ByStr20` |
|`BurnSuccessCallBack`| `sender : ByStr20, amount : Uint128` |