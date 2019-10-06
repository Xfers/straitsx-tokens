# Xfers SGDX Stable Coin

The SGDX stablecoin consists of two communicating contracts namely a [token contract](https://github.com/AmritKumar/xfers-contracts/blob/master/contracts/sgdx_contract.scilla) and a [proxy contract](https://github.com/AmritKumar/xfers-contracts/blob/master/contracts/proxy.scilla). The token contract represents a standard fungible token contract with minting and burning features, while the proxy contract is a typical relay contract that redirects all calls to the token contract. The purpose of the proxy contract is to allow upgradeability of the token contract in scenarios where the token contract is found to contain bugs.

## Roles and Privileges in the Token Contract

Each of the contracts defines specific roles which comes with certain privileges. 

| Name | Description | Privileges |
|--|--|--|
|`init_owner` | The initial owner of the contract which is usually the creator of the contract. | |
|`owner` | Current owner of the contract initialized to `init_owner`.| |
