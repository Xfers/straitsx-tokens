# StraitsX Fiat Token v1

It allows minting/burning of tokens by multiple entities, pausing all activity, freezing of individual addresses, and a way to upgrade the contract so that bugs can be fixed or features added.

## Roles

The `FiatToken` has a number of roles (addresses) which control different functionality:

-   `masterMinter` - adds and removes minters by increasing and decreasing their minting allowance
-   `minters` - mint and burn tokens
-   `pauser` - pauses the contract, which prevents all transfers, minting, and burning
-   `blacklister` - prevents all transfers to or from a particular address, and prevents that address from minting or burning. Can also burn tokens from a blacklisted address at the request of regulatory bodies.
-   `owner` - re-assigns any of the roles except for `admin`
-   `admin` - upgrades the contract, and re-assign itself

## Minting and Burning tokens

The smart contract allows multiple entities to mint and burn tokens. Each entity, also known as a `minter`, has a `mintingAllowance` which is configured by the `masterMinter`. The `mintingAllowance` determines how many tokens that `minter` is allowed to mint and will decrease accordingly when tokens are minted. The `mintingAllowance` is to limit the damage if any particular `minter` is compromised.

### Adding Minters

New minters can be added by calling the `increaseMinterAllowance` method and specifying the address of the `minter` and an `increasedAmount`, which is the additional amount of tokens that an address is allowed to mint. As described earlier, the `mintingAllowance` of a `minter` will decrease as tokens are being minted.

-   Only the `masterMinter` role may call `increaseMinterAllowance`.

### Increasing Minting Allowance

`mintingAllowance` of `minters` can be increased by calling the `increaseMinterAllowance` method and specifying the address of the `minter` and an `increasedAmount`, which is the additional amount of tokens that an address is allowed to mint.

-   Only the `masterMinter` role may call `increaseMinterAllowance`.

### Reducing Minting Allowance

`mintingAllowance` of `minters` can also be manually decreased by calling the `decreaseMinterAllowance` method and specifying the address of the `minter` and a `decreasedAmount`, which is the amount of allowance to be subtracted from a minter's existing `mintingAllowance`. If the `mintingAllowance` reaches 0, the minter is automatically removed and will no longer be able to mint or burn any tokens.

-   Only the `masterMinter` role may call `decreaseMinterAllowance`.

### Minting

A `minter` mints tokens via the `mint` method. The `minter` specifies the `amount` of tokens to create, and a `to` address which will own the newly created tokens. A `minter` may only mint an amount less than or equal to its `mintingAllowance`. The `mintingAllowance` will decrease by the amount of tokens minted, and the balance of the `to` address and `totalSupply` will each increase by `amount`.

-   Only a `minter` may call `mint`.
-   Minting fails when the contract is `paused`.
-   Minting fails when the `minter` or `to` address is blacklisted.
-   Minting fails when the `to` address is the null address i.e. 0x0000000000000000000000000000000000000000
-   Minting fails when the `amount` to be minted exceeds a minter's `mintingAllowance`.
-   Minting emits a `Mint(minter, to, amount)` event and a `Transfer(0x0000000000000000000000000000000000000000, to, amount)` event.

### Burning

A `minter` burns tokens via the `burn` method. The `minter` specifies the `amount` of tokens to burn, and the `minter` must have a token `balance` greater than or equal to the `amount` to be burnt. Burning tokens is restricted to `minter` addresses to avoid accidental burning of tokens by end users. A `minter` requires at least a `mintingAllowance` of 1 in order to burn tokens. A `minter` can only burn tokens which it owns. When tokens are burnt, the token balance of the `minter` and the `totalSupply` are reduced by `amount`.

Burning tokens will not increase or decrease the `mintingAllowance` of the address of the `minter` doing the burning.

-   Only a `minter` may call burn.
-   Burning fails when the contract is paused.
-   Burning fails when the `minter` is blacklisted.
-   Burning fails when the `amount` is 0.
-   Burning fails when the token `balance` of the `minter` is less than the `amount` it is trying to burn. 
-   Burning emits a `Burn(minter, amount)` event, and a `Transfer(minter, 0x0000000000000000000000000000000000000000, amount)` event.

## Blacklisting

Addresses can be blacklisted. A blacklisted address will be unable to transfer tokens, approve, mint, or burn tokens. Addresses may be blacklisted for a variety of reasons, one of which is at the request of regulatory bodies. In such cases, they may also request for us to burn the token balances of the blacklisted address.

### Adding a blacklisted address

Addresses can be blacklisted by calling the `blacklist` method. The specified `account` will be added to the blacklist.

-   Only the `blacklister` role may call `blacklist`.
-   Blacklisting emits a `Blacklist(account)` event

### Removing a blacklisted address

Addresses can be unblacklisted by calling the `unblacklist` method. The specified `account` will be removed from the blacklist.

-   Only the `blacklister` role may call `unblacklist`.
-   Unblacklisting emits an `UnBlacklist(account)` event.

### Burning tokens of a blacklisted address

At the request of regulatory bodies, token balance of a blacklisted address can be burnt by calling the `lawEnforcementWipingBurn` method. The token balance of the blacklisted address is reduced to 0 and the `totalSupply` is reduced by the amount of tokens that was burnt.

- Only the `blacklister` role may call `lawEnforcementWipingBurn`. 
- `lawEnforcementWipingBurn` fails when the contract is paused.
- `lawEnforcementWipingBurn` fails when if the `account` to perform this action on is not a blacklisted account.
- lawEnforcementWipingBurn emits a `Burn(account, amount)` event, and a `Transfer(account, 0x0000000000000000000000000000000000000000, amount)` event.

## Pausing

The entire contract can be paused in the event a serious bug is found or if there is a key compromise. All transfers, token approvals, minting and burning will be prevented while the contract is paused. Other functionality, such as modifying the blacklist, increasing or decreasing minter allowance, changing roles, and upgrading will remain operational as those methods may be required to fix or mitigate the issue that caused Xfers to pause the contract.

### Pause

The `pauser` can pauser the contract by calling the `pause` method. This method will set the `paused` flag to true.

-   Only the `pauser` role may call pause.
-   Pausing emits a `Pause()` event

### Unpause

The `pauser` can unpause the contract by calling the `unpause` method. This method will set the `paused` flag to false.
All functionality will be restored when the contract is unpaused.

-   Only the `pauser` role may call unpause.
-   Unpausing emits an `Unpause()` event

## Upgrading

The Fiat Token uses the zeppelinos Unstructured-Storage Proxy pattern [https://docs.openzeppelin.com/upgrades/2.7/proxies#unstructured-storage-proxies]. [FiatToken.sol](../contracts/FiatTokenV1.sol) is the implementation, the actual token will be a Proxy contract ([FiatTokenProxy.sol](../contracts/FiatTokenProxy.sol)) which will forward all calls to `FiatToken` via delegatecall.

-   The `admin` will upgrade the token via a call to `upgradeTo` or `upgradeToAndCall` if initialization is required for the new version.
-   Only the `admin` role may call `upgradeTo` or `upgradeToAndCall`.

## Reassigning Roles

The roles outlined above may be reassigned.
The `owner` role has the ability to reassign all roles (including itself) except for the `admin` role.

### Admin

-   `changeAdmin` updates the `admin` role to a new address.
-   `changeAdmin` may only be called by the `admin` role.

### Master Minter

-   `updateMasterMinter` updates the `masterMinter` role to a new address.
-   `updateMasterMinter` may only be called by the `owner` role.

### Pauser

-   `updatePauser` updates the `pauser` role to a new address.
-   `updatePauser` may only be called by the `owner` role.

### Blacklister

-   `updateBlacklister` updates the `blacklister` role to a new address.
-   `updateBlacklister` may only be called by the `owner` role.

### Owner

-   `transferOwnership` updates the `owner` role to a new address.
-   `transferOwnership` may only be called by the `owner` role.
