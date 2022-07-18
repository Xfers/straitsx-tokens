# Initial Deployment

This is the process for deploying a new proxy and implementation (as opposed to upgrading an existing proxy).

Since the proxy uses `delegatecall` to forward calls to the implementation, initialization of the contracts becomes a little tricky because we can not initialize fields in the implementation contract via the constructor. Instead there is an `initialize` method in the implementation contract, which is publicly available, but can only be called once per implementation.


## Deploying the implementation contract
1. Deploy [FiatTokenV1](../contracts/FiatTokenV1.sol)
2. Initialize the fields in FiatToken via the `initialize` method. The values are not important, but this will stop anyone else initializing the roles and trying to use it as a token or pass it off as a real StraitsX token. 
```
initialize(
   "",
   "",
   "",
   0,
   throwawayAddress,
   throwawayAddress,
   throwawayAddress,
   throwawayAddress
)
```

## Deploying a Proxy:

1. Obtain addresses for the various contract roles from Xfers ops. The keys for these addresses will be stored offline.
The address needed are:
```
admin
masterMinter
pauser
blacklister
owner
```
For details on what these roles can do, see the [Token Design Doc](tokendesign.md)

2. Deploy [FiatTokenProxy](../contracts/FiatTokenProxy.sol), passing the address of the deployed implementation contract to the constructor, which will be stored on the `implementation` field.

3. The `admin` of the proxy contract defaults to msg.sender. Due to the way the `AdminUpgradeabilityProxy` is designed, if you try to call any functions in the proxied contract with the `admin` of the proxy, the call will revert. You can read more about this [here](https://docs.openzeppelin.com/upgrades/2.7/proxies#transparent-proxies-and-function-clashes). You can either change the `admin` now, or call functions in the proxied contract from a different address. The `admin` address can be changed by calling `changeAdmin`. Note that change admin must be called by the current admin.
```
changeAdmin(adminAddress)
```

4. Initialize the proxy, via the `initialize` method. This call will get forwarded to the implementation contract, but since it is via `delegatecall` it will run in the context of the Proxy contract, so the fields it is initializing will be stored it the storage of the Proxy. The values passed here are important, especially for the roles that will control the contract. These addresses should be obtained from Xfers ops, and the keys will be stored offline.

```
initialize(
   "XSGD",
   "XSGD",
   6,
   masterMinterAddress,
   pauserAddress,
   blacklisterAddress,
   ownerAddress
)
```