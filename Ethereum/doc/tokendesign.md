# Xfers Fiat Token v1

It allows minting/burning of tokens by multiple entities, pausing all activity, freezing of individual addresses, and a way to upgrade the contract so that bugs can be fixed or features added.

## Roles

The `FiatToken` has a number of roles (addresses) which control different functionality:

-   `masterMinter` - adds and removes minters and increases their minting allowance
-   `minters` - create and destroy tokens
-   `pauser` - pause the contract, which prevents all transfers, minting, and burning
-   `blacklister` - prevent all transfers to or from a particular address, and prevents that address from minting or burning
-   `owner` - re-assign any of the roles except for `admin`
-   `admin` - upgrade the contract, and re-assign itself

Xfers will control the address of all roles except for minters, which will be controlled by the entities that Xfers elects to make minters.

## Issuing and Destroying tokens

The smart contract allows multiple entities to create and destroy tokens. These entities will have to be members of Xfers, and will be vetted by Xfers before they are allowed to create new or destroy existing tokens. Moreover, Xfers will not mint any tokens itself, it will instead approve members to mint and burn tokens.

Each `minter` has a `mintingAllowance`, which Xfers configures. The `mintingAllowance` is how many tokens that `minter` may issue. As a `minter` mints new tokens, its `mintingAllowance` decreases. Xfers will periodically increase the `mintingAllowance` as long as a `minter` remains in good standing with Xfers and maintains adequate reserves for the tokens it has issued. The `mintingAllowance` is to limit the damage if any particular `minter` is compromised.

### Adding Minters

Xfers adds new minters by calling the `increaseMinterAllowance` method and specifying the address of the `minter` and an `increasedAmount`, which is the number of tokens that address is allowed to mint. As described earlier, the `mintingAllowance` of a `minter` will decrease as tokens are being minted.

-   Only the `masterMinter` role may call `increaseMinterAllowance`.

### Increasing Minting Allowance

The `minters` will need their allowance increased periodically to allow them to continue minting. When a `minter`'s allowance is low, Xfers can make another call to `increaseMinterAllowance` to increase the `mintingAllowance` to a higher value.

### Reducing Minting Allowance

Xfers can also manually reduce the allowance of minters by calling the `decreaseMinterAllowance` method and specifying the address of the `minter` and a `decreasedAmount`, which is the amount of allowance to be subtracted from a minter's existing `mintingAllowance`. If the `mintingAllowance` reaches 0, the minter is automatically removed and will no longer be able to mint or burn any tokens.

-   Only the `masterMinter` role may call `decreaseMinterAllowance`.

### Minting

A `minter` mints tokens via the `mint` method. The `minter` specifies the `amount` of tokens to create, and a `to` address which will own the newly created tokens. A `minter` may only mint an amount less than or equal to its `mintingAllowance`. The `mintingAllowance` will decrease by the amount of tokens minted, and the balance of the `to` address and `totalSupply`
will each increase by `amount`.

-   Only a `minter` may call `mint`.
-   Minting fails when the contract is `paused`.
-   Minting fails when the `minter` or `to` address is blacklisted.
-   Minting fails when the `to` address is the null address i.e. 0x0000000000000000000000000000000000000000
-   Minting fails when the `amount` to be minted exceeds a minter's `mintingAllowance`.
-   Minting emits a `Mint(minter, to, amount)` event and a `Transfer(0x0000000000000000000000000000000000000000, to, amount)` event.

### Burning

A `minter` burns tokens via the `burn` method. The `minter` specifies the `amount` of tokens to burn, and the `minter` must have a token `balance` greater than or equal to the `amount` to be burnt. Burning tokens is restricted to `minter` addresses to avoid accidental burning of tokens by end users. A `minter` requires at least a `mintingAllowance` of 1 in order to burn tokens. A `minter` can only burn tokens which it owns. When a minter burns tokens, its balance and the totalSupply are reduced by `amount`.

Burning tokens will not increase the `mintingAllowance` of the address doing the burning.

-   Only a `minter` may call burn.
-   Burning fails when the contract is paused.
-   Burning fails when the `minter` is blacklisted.
-   Burning fails when the `amount` is 0.
-   Burning fails when the token `balance` of the `minter` is less than the `amount` it is trying to burn. 
-   Burning emits a `Burn(minter, amount)` event, and a `Transfer(minter, 0x0000000000000000000000000000000000000000, amount)` event.

## Blacklisting

Addresses can be blacklisted. A blacklisted address will be unable to transfer tokens, approve, mint, or burn tokens.

### Adding a blacklisted address

Xfers blacklists an address by calling the `blacklist` method. The specified `account` will be added to the blacklist.

-   Only the `blacklister` role may call `blacklist`.
-   Blacklisting emits a `Blacklist(account)` event

### Removing a blacklisted address

Xfers removes an address from the blacklist via the `unblacklist` method. The specified `account` will be removed from the blacklist.

-   Only the `blacklister` role may call `unblacklist`.
-   Unblacklisting emits an `UnBlacklist(account)` event.

## Pausing

The entire contract can be paused in the event a serious bug is found or there is a key compromise. All transfers, token approvals, minting and burning will be prevented while the contract is paused. Other functionality, such as modifying the blacklist, increasing or decreasing minter allowance, changing roles, and upgrading will remain operational as those methods may be required to fix or mitigate the issue that caused Xfers to pause the contract.

### Pause

Xfers will pause the contract via the `pause` method. This method will set the `paused` flag to true.

-   Only the `pauser` role may call pause.
-   Pausing emits a `Pause()` event

### Unpause

Xfers will unpause the contract via the `unpause` method. This method will set the `paused` flag to false.
All functionality will be restored when the contract is unpaused.

-   Only the `pauser` role may call unpause.
-   Unpausing emits an `Unpause()` event

## Upgrading

The Fiat Token uses the zeppelinos Unstructured-Storage Proxy pattern [https://docs.openzeppelin.com/upgrades/2.7/proxies#unstructured-storage-proxies]. [FiatToken.sol](../contracts/FiatTokenV1.sol) is the implementation, the actual token will be a Proxy contract ([FiatTokenProxy.sol](../contracts/FiatTokenProxy.sol)) which will forward all calls to `FiatToken` via
delegatecall. This pattern allows Xfers to upgrade the logic of any deployed tokens seamlessly.

-   Xfers will upgrade the token via a call to `upgradeTo` or `upgradeToAndCall` if initialization is required for the new version.
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
