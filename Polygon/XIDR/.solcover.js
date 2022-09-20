module.exports = {
    port: 8555,
    testrpcOptions: '-p 8555 -d --accounts 15',
    skipFiles: [
        'test/',
        'MultiSigWallet.sol'
    ],
    copyPackages: ['openzeppelin-solidity', 'zos-lib']
};
