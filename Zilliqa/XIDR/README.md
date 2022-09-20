# StraitsX IDR (XIDR)

## Token Description
The StraitsX SIDRGD (XIDR) token is the first digital token fully collateralized one-for-one with Indonesia Dollar (IDR) and representing 1 IDR. The XIDR token is written as a smart contract on Zilliqa's high-throughput decentralised public blockchain following the ZRC2 protocol and is governed by the StraitsX network whereby XIDR tokens are centrally minted and burned by Xfers Pte. Ltd.

[Xfers](https://www.xfers.com/sg/) is an approved holder of a Major Payment Institution license ("MPI") for e-money issuance licensed by the Monetary Authority of Singapore (MAS)

## Smart Contract Specifications
The XIDR contract has been written by the StraitsX team to fit both the specific needs of the XIDR token as described in the StraitsX Whitepaper and the requirement to comply with local regulation.

The XIDR contract consists of two communicating contracts:
- [token contract](https://github.com/Xfers/StraitsX-tokens/blob/master/Zilliqa/XIDR/contracts/xidr_contract.scilla)
- [proxy contract](https://github.com/Xfers/StraitsX-tokens/blob/master/Zilliqa/XIDR/contracts/proxy.scilla)

The token contract represents a standard fungible token contract with minting and burning features, while the proxy contract is a typical relay contract that redirects all calls to the token contract. This allows upgrading the contract, as the original proxy can point to a newly deployed token contract.

And one multi-signature contract:
- [multi-signature contract](https://github.com/Xfers/StraitsX-tokens/blob/master/Zilliqa/XIDR/contracts/wallet.scilla)

The multi-signature contract is a digital signature scheme which allows a group of users(owners) to submit, sign and execute transactions in proxy contract.

All contracts here also have a minimized version in `/compressed` folder because there is a maximum code size limit of 20,480 bytes in Zilliqa.

## Token contract
### Roles and Privileges

| Name | Description & Privileges |
|--|--|
|`init_owner`| The initial owner of the token contract. It is usually the creator of the token contract. |
|`owner`| The current owner of the token contract. The `owner` handles critical administrative actions, e.g., determining which address plays which role in the token contract. There is only one `owner` and it is first initialized to `init_owner`.|
|`pauser`| The current pauser of the token contract. The `pauser` is allowed to (un)pause the contract. There is only one `pauser` and it is first initialized to `init_owner`.|
|`masterMinter`| The current master minter of the token contract. The `masterMinter` manages the minters and configures the number of tokens that each minter is allowed to mint. There is only one `masterMinter` and it is first initialized to `init_owner`. |
|`minter`| A role that is allowed to mint and burn new tokens. The token contract defines several minters and the number of tokens that each minter is allowed to mint in the `minterAllowances` field. The `IncreaseMinterAllowance` transition is called by the `masterMinter` for adding a new `minter` by increasing the it's minterAllowance. There can be more than one `minter` in the token contract. |
|`blacklister`| The current blacklister of the token contract. The `blacklister` is used to (un)freeze & wipe the balance from any other account when required to do so by law enforcement. The presence of this function in the code is a mandatory regulatory requirement. StraitsX will never use this function on its own accord. There is only one `blacklister` and it is first initialized to `init_owner`. |
|`initiator`| The user who calls the proxy contract which in turn calls the token contract. After deployment, the address of the token contract will be made known to the user and the code will be visible directly from the block explorer. |

### Immutable Parameters

The table below lists the parameters that are defined at the contract deployment time and hence cannot be changed later on.

| Name | Type | Description |
|--|--|--|
|`init_owner`| `ByStr20` | The initial owner of the token contract. |
|`proxy_address` | `ByStr20` | Address of the proxy contract. |

### Mutable Fields
The table below presents the mutable fields of the token contract and their initial values.

| Name | Type | Initial Value |Description |
|--|--|--|--|
|`owner`| `ByStr20` | `init_owner` | Current `owner` of the contract. |
|`pauser`| `ByStr20` | `init_owner` | Current `pauser` in the contract. |
|`masterMinter`| `ByStr20` | `init_owner` | Current `masterMinter` in the contract.|
|`paused`| `Bool` | `True` | Keeps track of whether the contract is current paused or not. `True` means the contract is paused. |
|`blacklister`| `ByStr20` | `init_owner` | Current `blacklister` in the contract.|
|`blacklisted`| `Map ByStr20 Uint128` | `Emp ByStr20 Uint128` | Records the addresses that are blacklisted. An address that is present in the map is blacklisted irrespective of the value it is mapped to. |
|`minterAllowances`| `Map ByStr20 (Option Uint128)` | `Emp ByStr20 (Option Uint128)` | Keeps track of the allowed number of tokens that a `minter` can mint (tokens allowed to mint = minterAllowances[minter address]). <br> `Option t` can present as the `Some` type `t` or the `None` type ([See detail](https://scilla.readthedocs.io/en/latest/scilla-in-depth.html#option)). |

### Transitions

Note that each of the transitions in the token contract takes `initiator` as a parameter which as explained above is the caller that calls the proxy contract which in turn calls the token contract.

All the transitions in the contract can be categorized into four categories:
- _housekeeping transitions_ meant to facilitate basic admin related tasks.
- _pause transitions_ meant to pause and unpause the contract.
- _minting-related transitions_ that allows mining and burning of tokens.
- _token transfer transitions_ allows to transfer tokens from one user to another.


Each of these category of transitions are presented in further details below:

#### HouseKeeping Transitions

| Name | Params | Description | Callable when paused? |
|--|--|--|--|
|`TransferOwnership`|`newOwner : ByStr20, initiator : ByStr20`| Allows the current `owner` to transfer control of the contract to a `newOwner`. <br> :warning: **Note:** 1) `initiator` must be the current `owner` in the contract, 2) The `newOwner` cannot be the null address or current owner. | :heavy_check_mark: |
|`UpdatePauser`| `newPauser : ByStr20, initiator : ByStr20` | Replace the current `pauser` with the `newPauser`. <br> :warning: **Note:** 1) `initiator` must be the current `owner` in the contract, 2) The `newPauser` cannot be the null address or the current pauser. | :heavy_check_mark: |
|`Blacklist`|`address : ByStr20, initiator : ByStr20`| Blacklists a given address. A blacklisted address can neither send or receive tokens. Any `address` regardless of role can be blacklisted. <br> :warning: **Note:** 1) `initiator` must be the current `blacklister` in the contract, 2) The `address` to be blacklisted cannot be the null address or is already blacklisted. | :heavy_check_mark: |
|`Unblacklist`|`address : ByStr20, initiator : ByStr20`| Removes a given address from the blacklist. <br> :warning: **Note:** 1) `initiator` must be the current `blacklister` in the contract, 2) The `address` to be removed from the blacklist cannot be the null address or is not blacklisted. | :heavy_check_mark: |
|`UpdateBlacklister`|`newBlacklister : ByStr20, initiator : ByStr20`| Replace the current `blacklister` with the `newBlacklister`. <br> :warning: **Note:** 1) `initiator` must be the current `owner` in the contract, 2) The `newBlacklister` cannot be the null address or the current blacklister. | :heavy_check_mark: |
|`UpdateMasterMinter`| `newMasterMinter : ByStr20, initiator : ByStr20` | Replace the current `masterMinter` with the `newMasterMinter`. <br> :warning: **Note:** 1) `initiator` must be the current `owner` in the contract, 2) The `newMasterMinter` cannot be the null address or the current master minter. | :heavy_check_mark: |
|`IncreaseMinterAllowance`| `minter : ByStr20, amount : Uint128, initiator : ByStr20` | Increase the number of tokens that a `minter` is allowed to mint. <br> :warning: **Note:** 1) `initiator` must be the current `masterMinter` in the contract, 2) The `minter` cannot be the null address. | :heavy_check_mark: |
|`DecreaseMinterAllowance`| `minter : ByStr20, amount : Uint128, initiator : ByStr20` | Decrease the number of tokens that a `minter` is allowed to mint. <br> If the `amount` to be subtracted is greater than or equal to the `minter`'s `minterAllowance`, it will become `None (Option) instead`. This is to indicate that the `minter` has been removed. Once removed, they will not be able to continue burning. <br> :warning: **Note:** 1) `initiator` must be the current `masterMinter` in the contract, 2) The `minter` cannot be the null address. | :heavy_check_mark: |

#### Pause Transitions

| Name | Params | Description | Callable when paused? |
|--|--|--|--|
|`Pause`| `initiator : ByStr20` | Pause the contract to temporarily stop all transfer of tokens and other operations. Only the current `pauser` can invoke this transition.  <br>  :warning: **Note:** 1) `initiator` must be the current `pauser` in the contract, 2) The contract must currently be in the unpaused state.  | :heavy_check_mark: |
|`Unpause`| `initiator : ByStr20` | Unpause the contract to re-allow all transfer of tokens and other operations. Only the current `pauser` can invoke this transition.  <br>  :warning: **Note:** 1) `initiator` must be the current `pauser` in the contract, 2) The contract must currently be in the paused state.  | :heavy_check_mark: |

#### Minting-related Transitions

| Name | Params | Description | Callable when paused? |
|--|--|--|--|
|`Mint`| `to: ByStr20, amount : Uint128, initiator : ByStr20, to_bal : Uint128, current_supply : Uint128` | Mint `amount` number of new tokens and allocate them to the `to` address.  <br>  :warning: **Note:** 1) Minting is a privileged transition that can be invoked only by non-blacklisted minters, i.e., `initiator` must be a non-blacklisted `minter`, 2) Minting can only be done when the contract is not paused, 3) The `to` address cannot be blacklisted nor null. | <center>:x:</center> |
|`Burn`| `amount : Uint128, initiator : ByStr20, initiator_balance : Uint128, current_supply : Uint128` | Burn `amount` number of tokens.  <br>  :warning: **Note:**   1) Burning is a privileged transition that can be invoked only by non-blacklisted minters, i.e., `initiator` must be a non-blacklisted `minter`, 2) Burning can only be done when the contract is not paused.| <center>:x:</center>  |
|`LawEnforcementWipingBurn`| `address : ByStr20, initiator : ByStr20, addr_bal : Uint128, current_supply : Uint128` | Burn entire balance of tokens from `address`.  <br>  :warning: **Note:** 1) Only the blacklister can invoke this transition, i.e., `initiator` must be the `blacklister` and is not blacklisted, 2) Burning can only be done when the contract is not paused, 3) Only accounts that have been blacklisted by the blacklister may have their funds wiped.| <center>:x:</center>  |

#### Token Transfer Transitions

| Name | Params | Description | Callable when paused? |
|--|--|--|--|
|`IncreaseAllowance`| `spender : ByStr20, amount : Uint128, initiator : ByStr20, current_allowance : Uint128` | Increase token allowance by `amount` amount of a `spender` to spend on behalf of a token holder (`initiator`) . <br> :warning: **Note:** 1) `initiator` and `spender` must not be blacklisted, 2) `initiator` and `spender` cannot be the same address i.e. increase allowance for self, 3) Increasing allowance can only be done when the contract is not paused. | <center>:x:</center>  |
|`DecreaseAllowance`| `spender : ByStr20, amount : Uint128, initiator : ByStr20, current_allowance : Uint128` | Decrease `amount` amount of a `spender` to spend on behalf of a token holder (`initiator`) . <br> :warning: **Note:** 1) `initiator` and `spender` must not be blacklisted, 2) `initiator` and `spender` cannot be the same address i.e. increase allowance for self, 3) Decreasing allowance can only be done when the contract is not paused. | <center>:x:</center>  |
|`Transfer`| `to : ByStr20, amount : Uint128, initiator : ByStr20, to_bal : Uint128, init_bal : Uint128` | Transfer `amount` number of tokens from the `initiator` to the `to` address.  <br>  :warning: **Note:** 1) The `initiator` and `to` addresses should not be blacklisted, 2) The `initiator` and `to` addresses cannot be the same address i.e. transfer to self, 3) `to` cannot be the null address, 4) `Transfer` can only be called when the contract is not paused. |<center>:x:</center>  |
|`TransferFrom`| `from : ByStr20, to : ByStr20, amount : Uint128, initiator : ByStr20, to_bal : Uint128, from_bal : Uint128, spender_allowance : Uint128` | Transfer `amount` number of tokens on behalf of the `initiator` to the `to` address.  <br>  :warning: **Note:**  1) The `initiator`, `from`  and `to` addresses should not be blacklisted, 2) `from` and `to` addresses cannot be the same i.e. transferFrom to self, 3) `to` cannot be the null address, 4) `TransferFrom` can only be called when the contract is not paused. |<center>:x:</center>  |

## Proxy Contract

Proxy contract is a relay contract that redirects calls to it to the token contract.

### Proxy contract Roles and Privileges

| Name | Description & Privileges |
|--|--|
|`init_admin`| The initial admin of the proxy contract. It is usually the creator of the proxy contract. |
|`admin`| The current admin of the proxy contract. The `admin` handles critical administrative actions, e.g., changing implementation of contract. There is only one `admin` and it is first initialized to `init_admin`.
|`contract_owner`| The contract owner of the contract. It is usually the creator of the contract. The `contract_owner` role has no functionality outside of being used to comply with the ZRC2 standard.|
|`spender`| A token holder can designate another address(es) to send up to a certain number of tokens on its behalf. The proxy contract defines each token holder and the number of tokens that a `spender` address is allowed to spend on behalf of the token holder in the `allowances` field.|

### Immutable Parameters

The table below lists the parameters that are defined at the contract deployment time and hence cannot be changed later on.

| Name | Type | Description |
|--|--|--|
|`contract_owner`|`ByStr20`| The contract owner of the proxy address.|
|`name`| `String` | A human readable token name. |
|`symbol`| `String` | A ticker symbol for the token. |
|`decimals`| `Uint32` | Defines the smallest unit of the tokens|
|`init_supply`|`Uint128` | The initial supply of tokens which is 0 |
|`init_implementation`|`ByStr20`| The initial implementation contract address |
|`init_admin`|`ByStr20`| The initial admin of the proxy contract |

### Mutable Fields
The table below presents the mutable fields of the token contract and their initial values.

| Name | Type | Initial Value |Description |
|--|--|--|--|
|`implementation`|`ByStr20`|`init_implementation` | Current `implementation` address of the token contract. |
|`admin`|`ByStr20`|`init_admin` | Current `admin` address of the token contract. |
|`balances`|`Map ByStr20 Uint128`|`let emp_map = Emp ByStr20 Uint128 in builtin put emp_map contract_owner init_supply` | Keeps track of the balance for each token holder. (balance of an address = balances[holder address]) |
|`total_supply`|`Uint128`|`init_supply`| Total supply of tokens |
|`allowances`| `Map ByStr20 (Map ByStr20 Uint128)` | `Emp ByStr20 (Map ByStr20 Uint128)` | Keeps track of the allowance of each `spender` for each token holder and the number of tokens that the `spender` is allowed to spend on behalf of the token holder. (token allowed to spend = allowed[holder address][spender address]) |

### Transitions

All the transitions in the contract can be categorized into three categories:
- _housekeeping transitions_ meant to facilitate basic admin related tasks.
- _relay transitions_ to redirect calls to the token contract.
- _callback transitions_ are called by the token contract for updating fields in proxy contract.

#### Housekeeping Transitions

| Name | Params | Description |
|--|--|--|
|`UpgradeTo`| `newImplementation : ByStr20` |  Change the current implementation address of the token contract. <br> :warning: **Note:** Only the `admin` can invoke this transition|
|`ChangeAdmin`| `newAdmin : ByStr20` |  Change the current `admin` of the contract. <br> :warning: **Note:** Only the `admin` can invoke this transition|

#### Relay Transitions

Note that these transitions are just meant to redirect calls to the corresponding token contract and hence their names have an added prefix `proxy`. While, redirecting the contract prepares the `initiator` value that is the address of the caller of the proxy contract.

| Transition signature in the proxy contract  | Target transition in the token contract |
|--|--|
|`TransferOwnership(newOwner : ByStr20)` | `TransferOwnership(newOwner : ByStr20, initiator : ByStr20)` |
|`Pause()` | `Pause(initiator : ByStr20)` |
|`Unpause()` | `Unpause(initiator : ByStr20)` |
|`UpdatePauser(newPauser : ByStr20)` | `UpdatePauser(newPauser : ByStr20, initiator : ByStr20)` |
|`Blacklist(address : ByStr20)` | `Blacklist(address : ByStr20, initiator : ByStr20)` |
|`Unblacklist(address : ByStr20)` | `Unblacklist(address : ByStr20, initiator : ByStr20)` |
|`UpdateBlacklister(newBlacklister : ByStr20)` | `UpdateBlacklister(newBlacklister : ByStr20, initiator : ByStr20)` |
|`Mint(recipient: ByStr20, amount : Uint128)` | `Mint(to: ByStr20, amount : Uint128, initiator : ByStr20, to_bal : Uint128, current_supply : Uint128)` |
|`IncreaseAllowance(spender : ByStr20, amount : Uint128)` | `IncreaseAllowance(spender : ByStr20, amount : Uint128, initiator : ByStr20, current_allowance : Uint128)` |
|`DecreaseAllowance(spender : ByStr20, amount : Uint128)` | `DecreaseAllowance(spender : ByStr20, amount : Uint128, initiator : ByStr20, current_allowance : Uint128)` |
|`TransferFrom(from : ByStr20, to : ByStr20, amount : Uint128)` | `TransferFrom (from : ByStr20, to : ByStr20, amount : Uint128, initiator : ByStr20, to_bal : Uint128, from_bal : Uint128, spender_allowance : Uint128)` |
|`Transfer(to : ByStr20, amount : Uint128)` | `Transfer(to : ByStr20, amount : Uint128, initiator : ByStr20, to_bal : Uint128, init_bal : Uint128)` |
|`Burn(amount : Uint128)` | `Burn(amount : Uint128, initiator : ByStr20, initiator_balance : Uint128, current_supply : Uint128)` |
|`LawEnforcementWipingBurn(address : ByStr20)` | `LawEnforcementWipingBurn(address : ByStr20, initiator : ByStr20, addr_bal : Uint128, current_supply : Uint128)` |
|`IncreaseMinterAllowance(minter : ByStr20, amount : Uint128)` | `IncreaseMinterAllowance(minter : ByStr20, amount : Uint128, initiator : ByStr20)` |
|`DecreaseMinterAllowance(minter : ByStr20, amount : Uint128)` | `DecreaseMinterAllowance(minter : ByStr20, amount : Uint128, initiator : ByStr20)` |
|`UpdateMasterMinter(newMasterMinter : ByStr20)` | `UpdateMasterMinter(newMasterMinter : ByStr20, initiator : ByStr20)` |

#### Callback Transitions

To ensure interoperability and composability of our XIDR token contract on the Zilliqa blockchain, the compulsory mutable variables like `balances`, `allowances` and `total_supply` are found in the proxy contract.

In order to update these variables on the proxy contract, we need to define some `callback transitions` for the `token contract` to call.

| Callback transition in the proxy contract  | Source transition in the token contract |
|--|--|
|`MintCallBack(to : ByStr20, new_to_bal : Uint128, new_supply : Uint128)` | `Mint(to: ByStr20, amount : Uint128, initiator : ByStr20, to_bal : Uint128, current_supply : Uint128)` |
|`AllowanceCallBack(initiator : ByStr20, spender : ByStr20, new_allowance : Uint128)`|`IncreaseAllowance(spender : ByStr20, amount : Uint128, initiator : ByStr20, current_allowance : Uint128), DecreaseAllowance(spender : ByStr20, amount : Uint128, initiator : ByStr20, current_allowance : Uint128), TransferFrom(from : ByStr20, to : ByStr20, amount : Uint128, initiator : ByStr20, to_bal : Uint128, from_bal : Uint128, spender_allowance : Uint128)`|
|`TransferFromCallBack(from : ByStr20, to : ByStr20, new_from_bal : Uint128, new_to_bal : Uint128)` | `TransferFrom(from : ByStr20, to : ByStr20, amount : Uint128, initiator : ByStr20, to_bal : Uint128, from_bal : Uint128, spender_allowance : Uint128)` |
|`TransferCallBack(to : ByStr20, initiator : ByStr20, new_to_bal : Uint128, new_init_bal : Uint128)` | `Transfer(to : ByStr20, amount : Uint128, initiator : ByStr20, to_bal : Uint128, init_bal : Uint128)` |
|`BurnCallBack(initiator : ByStr20, new_burn_balance : Uint128, new_supply : Uint128)` | `Burn(amount : Uint128, initiator : ByStr20, initiator_balance : Uint128, current_supply : Uint128)` |
|`LawEnforcementWipingBurnCallBack(address : ByStr20, new_supply : Uint128)` | `LawEnforcementWipingBurn(address : ByStr20, initiator : ByStr20, addr_bal : Uint128, current_supply : Uint128)` |

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
- The `_balance` field keeps the amount of funds held by the contract and can be freely read within the implementation. `AddFunds transition` are used for adding native funds(ZIL) to the wallet from incoming messages by using `accept` keyword.

#### Submit Transitions

| Name | Params | Description |
|--|--|--|
|`SubmitNativeTransaction`| `recipient : ByStr20, amount : Uint128, tag : String` | Submit a transaction of native tokens for future signoff |
|`SubmitCustomTransferOwnershipTransaction`| `proxyTokenContract : ByStr20, newOwner : ByStr20` | Submit a new `TransferOwnership` transaction for future signoff |
|`SubmitCustomUpdatePauserTransaction`| `proxyTokenContract : ByStr20, newPauser : ByStr20` | Submit a new `UpdatePauser` transaction for future signoff |
|`SubmitCustomBlacklistTransaction`| `proxyTokenContract : ByStr20, address : ByStr20` | Submit a new `Blacklist` transaction for future signoff |
|`SubmitCustomUnblacklistTransaction`| `proxyTokenContract : ByStr20, address : ByStr20` | Submit a new `Unblacklist` transaction for future signoff |
|`SubmitCustomUpdateBlacklisterTransaction`| `proxyTokenContract : ByStr20, newBlacklister : ByStr20` | Submit a new `UpdateBlacklister` transaction for future signoff |
|`SubmitCustomLawEnforcementWipingBurnTransaction`| `proxyTokenContract : ByStr20, address : ByStr20` | Submit a new `LawEnforcementWipingBurn` transaction for future signoff |
|`SubmitCustomBurnTransaction`| `proxyTokenContract : ByStr20, amount : Uint128` | Submit a new `Burn` transaction for future signoff |
|`SubmitCustomMintTransaction`| `proxyTokenContract : ByStr20, to : ByStr20, amount : Uint128` | Submit a new `Mint` transaction for future signoff |
|`SubmitCustomTransferTransaction`| `proxyTokenContract : ByStr20, to : ByStr20, amount : Uint128` | Submit a new `Transfer` transaction for future signoff |
|`SubmitCustomTransferFromTransaction`| `proxyTokenContract : ByStr20, from : ByStr20, to : ByStr20, amount : Uint128` | Submit a new `TransferFrom` transaction for future signoff |
|`SubmitCustomUpdateMasterMinterTransaction`| `proxyTokenContract : ByStr20, newMasterMinter : ByStr20` | Submit a new `UpdateMasterMinter` transaction for future signoff |
|`SubmitCustomIncreaseMinterAllowanceTransaction`| `proxyTokenContract : ByStr20, minter : ByStr20, amount : Uint128` | Submit a new `IncreaseMinterAllowance` transaction for future signoff |
|`SubmitCustomDecreaseMinterAllowanceTransaction`| `proxyTokenContract : ByStr20, minter : ByStr20, amount : Uint128` | Submit a new `DecreaseMinterAllowance` transaction for future signoff |
|`SubmitCustomPauseTransaction`| `proxyTokenContract : ByStr20` | Submit a new `Pause` transaction for future signoff |
|`SubmitCustomUnpauseTransaction`| `proxyTokenContract : ByStr20` | Submit a new `Unpause` transaction for future signoff |
|`SubmitCustomUpgradeToTransaction`| `proxyTokenContract : ByStr20, newImplementation : ByStr20` | Submit a new `UpgradeTo` transaction for future signoff |
|`SubmitCustomChangeAdminTransaction`| `proxyTokenContract : ByStr20, newAdmin : ByStr20` | Submit a new `ChangeAdmin` transaction for future signoff |

#### Action Transitions

| Name | Params | Description |
|--|--|--|
|`SignTransaction`| `transactionId : Uint32` | Sign off on an existing transaction. |
|`RevokeSignature`| `transactionId : Uint32` | Revoke signature of existing transaction, if it has not yet been executed. |
|`ExecuteTransaction`| `transactionId : Uint32` | Execute signed-off transaction. |

#### Callback Transitions

All the callback transitions can be categorized into two categories:
- _acceptance callback transitions_ will be called when this multi-signature contact is the `recipient` of the transaction.
:warning: This contract will not be able to receive ZRC2 or other tokens, unless the callback transition has been explicitly implemented in contract.
- _initiator callback transitions_ will be called when this multi-signature contact is the `initiator` of the transaction.
These `callback transitions` is necessary for building DApps on top of the stablecoins even if these are not used in the `multi-signature contract` and implemented with an empty body.

**Acceptance Callback Transitions**

| Name | Params |
|--|--|
|`RecipientAcceptTransfer`| `sender : ByStr20, recipient : ByStr20, amount : Uint128` |
|`RecipientAcceptTransferFrom`| `initiator: ByStr20, sender : ByStr20, recipient : ByStr20, amount : Uint128` |
|`RecipientAcceptMint`| `recipient : ByStr20, amount : Uint128` |

**Initiator Callback Transitions**

| Name | Params |
|--|--|
|`TransferSuccessCallBack`| `sender : ByStr20, recipient : ByStr20, amount : Uint128` |
|`TransferFromSuccessCallBack`| `initiator: ByStr20, sender : ByStr20, recipient : ByStr20, amount : Uint128` |
|`MintSuccessCallBack`| `recipient : ByStr20, amount : Uint128` |
|`LawEnforcementWipingBurnSuccessCallBack`| `address : ByStr20` |
|`BurnSuccessCallBack`| `sender : ByStr20, amount : Uint128` |
