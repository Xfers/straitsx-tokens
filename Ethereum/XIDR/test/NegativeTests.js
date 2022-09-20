var tokenUtils = require('./TokenTestUtils');
var BN = require('bn.js');
var assertDiff = require('assert-diff');
assertDiff.options.strict = true;

var bigZero = tokenUtils.bigZero;
var bigHundred = tokenUtils.bigHundred;
var mint = tokenUtils.mint;
var checkVariables = tokenUtils.checkVariables;
var expectRevert = tokenUtils.expectRevert;
var name = tokenUtils.name;
var symbol = tokenUtils.symbol;
var currency = tokenUtils.currency;
var decimals = tokenUtils.decimals;
var deployerAccount = tokenUtils.deployerAccount;
var arbitraryAccount = tokenUtils.arbitraryAccount;
var arbitraryAccount2 = tokenUtils.arbitraryAccount2;
var tokenOwnerAccount = tokenUtils.tokenOwnerAccount;
var tokenOwnerAccount = tokenUtils.tokenOwnerAccount;
var blacklisterAccount = tokenUtils.blacklisterAccount;
var masterMinterAccount = tokenUtils.masterMinterAccount;
var delegateAccount = tokenUtils.delegateAccount;
var minterAccount = tokenUtils.minterAccount;
var pauserAccount = tokenUtils.pauserAccount;
var proxyOwnerAccount = tokenUtils.proxyOwnerAccount;
var initializeTokenWithProxy = tokenUtils.initializeTokenWithProxy;
var customInitializeTokenWithProxy = tokenUtils.customInitializeTokenWithProxy;
var upgradeTo = tokenUtils.upgradeTo;
var UpgradedFiatToken = tokenUtils.UpgradedFiatToken;
var FiatToken = tokenUtils.FiatToken;

var amount = 100;
let longZero = "0x0000000000000000000000000000000000000000";
let shortZero = 0x00;

async function run_tests(newToken, accounts) {

  beforeEach('Make fresh token contract', async function () {
    rawToken = await newToken();
    var tokenConfig = await initializeTokenWithProxy(rawToken);
    proxy = tokenConfig.proxy;
    token = tokenConfig.token;
    assert.equal(proxy.address, token.address);
  });

  // Mint

  it('nt001 should fail to mint when paused', async function () {
    await token.increaseMinterAllowance(minterAccount, amount, {from: masterMinterAccount});
    await token.pause({from: pauserAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(amount)},
      {'variable': 'paused', 'expectedValue': true}
    ]
    await expectRevert(token.mint(arbitraryAccount, 50, {from: minterAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt002 should fail to mint when msg.sender is not a minter', async function () {
    //Note: minterAccount has not yet been configured as a minter
    await expectRevert(token.mint(arbitraryAccount, 50, {from: minterAccount}));
    await checkVariables([token], [[]]);
  });

  it('nt003 should fail to mint when msg.sender is blacklisted', async function () {
    await token.blacklist(minterAccount, {from: blacklisterAccount});
    await token.increaseMinterAllowance(minterAccount, amount, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(amount)},
      {'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true}
    ]
    await expectRevert(token.mint(arbitraryAccount, 50, {from: minterAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt004 should fail to mint when recipient is blacklisted', async function () {
    await token.blacklist(arbitraryAccount, {from: blacklisterAccount});
    await token.increaseMinterAllowance(minterAccount, amount, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(amount)},
      {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}
    ]
    await expectRevert(token.mint(arbitraryAccount, 50, {from: minterAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt005 should fail to mint when allowance of minter is less than amount', async function () {
    await token.increaseMinterAllowance(minterAccount, amount - 1, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(amount - 1)}
    ]
    await expectRevert(token.mint(arbitraryAccount, amount, {from: minterAccount}));
    await checkVariables([token], [customVars]);
  });

  // No tests for 0x0, "0x0", 0, 0x0000000000000000000000000000000000000000
  // 0x0 and "0x0" are invalid addresses https://github.com/ethereum/web3.js/blob/59aae306c1c31ef6a65b9196e7f03af74c69e059/lib/web3/formatters.js#L265
  // truffle treats 0 as accounts[0]
  // 0x0000000000000000000000000000000000000000 is intepreted as 0 (number).
  it('nt006 should fail to mint to "0x0000000000000000000000000000000000000000" address', async function () {
    await token.increaseMinterAllowance(minterAccount, amount, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(amount)}
    ]
    
    await expectRevert(token.mint(longZero, amount, {from: minterAccount}));
    await checkVariables([token], [customVars]);
  });

  // Approve

  it('nt008 should fail to increase allowance when spender is blacklisted', async function () {
    await token.blacklist(minterAccount, {from: blacklisterAccount});
    var customVars = [
      {'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true},
    ]
    await expectRevert(token.increaseAllowance(minterAccount, 100, {from: arbitraryAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt009 should fail to increase allowance when msg.sender is blacklisted', async function () {
    await token.blacklist(arbitraryAccount, {from: blacklisterAccount});
    var customVars = [
      {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true},
    ]
    await expectRevert(token.increaseAllowance(minterAccount, 100, {from: arbitraryAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt010 should fail to increase allowance when contract is paused', async function () {
    await token.pause({from: pauserAccount});
    var customVars = [
      {'variable': 'paused', 'expectedValue': true},
    ]
    await expectRevert(token.increaseAllowance(minterAccount, 100, {from: arbitraryAccount}));
    await checkVariables([token], [customVars]);
  });

  // TransferFrom

  // No tests for 0x0, "0x0", 0, 0x0000000000000000000000000000000000000000
  // 0x0 and "0x0" are invalid addresses https://github.com/ethereum/web3.js/blob/59aae306c1c31ef6a65b9196e7f03af74c69e059/lib/web3/formatters.js#L265
  // truffle treats 0 as accounts[0]
  // 0x0000000000000000000000000000000000000000 is intepreted as 0 (number).
  it('nt012 should fail to transferFrom to "0x0000000000000000000000000000000000000000" address', async function () {
    await token.increaseMinterAllowance(minterAccount, amount, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(arbitraryAccount, 50, {from: minterAccount});
    await token.increaseAllowance(pauserAccount, 50, {from: arbitraryAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(amount - 50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': web3.utils.toBN(50)},
      {'variable': 'totalSupply', 'expectedValue': web3.utils.toBN(50)},
      {'variable': 'allowance.arbitraryAccount.pauserAccount', 'expectedValue': web3.utils.toBN(50)}
    ]
    await expectRevert(token.transferFrom(arbitraryAccount, longZero, 50, {from: pauserAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt013 should fail to transferFrom an amount greater than balance', async function () {
    await token.increaseMinterAllowance(minterAccount, amount, {from: masterMinterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(arbitraryAccount, 50, {from: minterAccount});
    await token.increaseAllowance(blacklisterAccount, amount, {from: arbitraryAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(amount - 50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': web3.utils.toBN(50)},
      {'variable': 'totalSupply', 'expectedValue': web3.utils.toBN(50)},
      {'variable': 'allowance.arbitraryAccount.blacklisterAccount', 'expectedValue': web3.utils.toBN(amount)},
    ]
    await expectRevert(token.transferFrom(arbitraryAccount, pauserAccount, amount, {from: blacklisterAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt014 should fail to transferFrom to blacklisted recipient', async function () {
    await token.increaseMinterAllowance(minterAccount, amount, {from: masterMinterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(blacklisterAccount, 50, {from: minterAccount});
    await token.increaseAllowance(pauserAccount, 50, {from: blacklisterAccount});
    await token.blacklist(arbitraryAccount, {from: blacklisterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(amount - 50)},
      {'variable': 'balances.blacklisterAccount', 'expectedValue': web3.utils.toBN(50)},
      {'variable': 'totalSupply', 'expectedValue': web3.utils.toBN(50)},
      {'variable': 'allowance.blacklisterAccount.pauserAccount', 'expectedValue': web3.utils.toBN(50)},
      {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}
    ]
    await expectRevert(token.transferFrom(blacklisterAccount, arbitraryAccount, 50, {from: pauserAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt015 should fail to transferFrom from blacklisted msg.sender', async function () {
    await token.increaseMinterAllowance(minterAccount, amount, {from: masterMinterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(tokenOwnerAccount, 50, {from: minterAccount});
    await token.increaseAllowance(arbitraryAccount, 50, {from: tokenOwnerAccount});
    await token.blacklist(arbitraryAccount, {from: blacklisterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(amount - 50)},
      {'variable': 'balances.tokenOwnerAccount', 'expectedValue': web3.utils.toBN(50)},
      {'variable': 'totalSupply', 'expectedValue': web3.utils.toBN(50)},
      {'variable': 'allowance.tokenOwnerAccount.arbitraryAccount', 'expectedValue': web3.utils.toBN(50)},
      {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}
    ]
    await expectRevert(token.transferFrom(tokenOwnerAccount, pauserAccount, 50, {from: arbitraryAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt016 should fail to transferFrom when from is blacklisted', async function () {
    await token.increaseMinterAllowance(minterAccount, amount, {from: masterMinterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(arbitraryAccount, 50, {from: minterAccount});
    await token.increaseAllowance(tokenOwnerAccount, 50, {from: arbitraryAccount});
    await token.blacklist(arbitraryAccount, {from: blacklisterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(amount - 50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': web3.utils.toBN(50)},
      {'variable': 'totalSupply', 'expectedValue': web3.utils.toBN(50)},
      {'variable': 'allowance.arbitraryAccount.tokenOwnerAccount', 'expectedValue': web3.utils.toBN(50)},
      {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}
    ]
    await expectRevert(token.transferFrom(arbitraryAccount, pauserAccount, 50, {from: tokenOwnerAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt017 should fail to transferFrom an amount greater than allowed for msg.sender', async function () {
    await token.increaseMinterAllowance(minterAccount, amount, {from: masterMinterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(arbitraryAccount, 50, {from: minterAccount});
    await token.increaseAllowance(tokenOwnerAccount, 50, {from: arbitraryAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(amount - 50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': web3.utils.toBN(50)},
      {'variable': 'totalSupply', 'expectedValue': web3.utils.toBN(50)},
      {'variable': 'allowance.arbitraryAccount.tokenOwnerAccount', 'expectedValue': web3.utils.toBN(50)},
    ]
    await expectRevert(token.transferFrom(arbitraryAccount, pauserAccount, 60, {from: tokenOwnerAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt018 should fail to transferFrom when paused', async function () {
    await token.increaseMinterAllowance(minterAccount, amount, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(arbitraryAccount, 50, {from: minterAccount});
    await token.increaseAllowance(tokenOwnerAccount, 50, {from: arbitraryAccount});
    await token.pause({from: pauserAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(amount - 50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': web3.utils.toBN(50)},
      {'variable': 'totalSupply', 'expectedValue': web3.utils.toBN(50)},
      {'variable': 'allowance.arbitraryAccount.tokenOwnerAccount', 'expectedValue': web3.utils.toBN(50)},
      {'variable': 'paused', 'expectedValue': true}
    ]
    await expectRevert(token.transferFrom(arbitraryAccount, pauserAccount, 50, {from: tokenOwnerAccount}));
    await checkVariables([token], [customVars]);
  });

  // Transfer

  // No tests for 0x0, "0x0", 0, 0x0000000000000000000000000000000000000000
  // 0x0 and "0x0" are invalid addresses https://github.com/ethereum/web3.js/blob/59aae306c1c31ef6a65b9196e7f03af74c69e059/lib/web3/formatters.js#L265
  // truffle treats 0 as accounts[0]
  // 0x0000000000000000000000000000000000000000 is intepreted as 0 (number).
  it('nt020 should fail to transfer to "0x00000000000000000000000000000000000000000" address', async function () {
    await token.increaseMinterAllowance(minterAccount, amount, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(arbitraryAccount, 50, {from: minterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(amount - 50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': web3.utils.toBN(50)},
      {'variable': 'totalSupply', 'expectedValue': web3.utils.toBN(50)}
    ]
    await expectRevert(token.transfer(longZero, 50, {from: arbitraryAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt021 should fail to transfer an amount greater than balance', async function () {
    await token.increaseMinterAllowance(minterAccount, amount, {from: masterMinterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(arbitraryAccount, 50, {from: minterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(amount - 50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': web3.utils.toBN(50)},
      {'variable': 'totalSupply', 'expectedValue': web3.utils.toBN(50)}
    ]
    await expectRevert(token.transfer(pauserAccount, amount, {from: arbitraryAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt022 should fail to transfer to blacklisted recipient', async function () {
    await token.increaseMinterAllowance(minterAccount, amount, {from: masterMinterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(tokenOwnerAccount, 50, {from: minterAccount});
    await token.blacklist(arbitraryAccount, {from: blacklisterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(amount - 50)},
      {'variable': 'balances.tokenOwnerAccount', 'expectedValue': web3.utils.toBN(50)},
      {'variable': 'totalSupply', 'expectedValue': web3.utils.toBN(50)},
      {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}
    ]
    await expectRevert(token.transfer(arbitraryAccount, 50, {from: tokenOwnerAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt023 should fail to transfer when sender is blacklisted', async function () {
    await token.increaseMinterAllowance(minterAccount, amount, {from: masterMinterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(arbitraryAccount, 50, {from: minterAccount});
    await token.blacklist(arbitraryAccount, {from: blacklisterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(amount - 50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': web3.utils.toBN(50)},
      {'variable': 'totalSupply', 'expectedValue': web3.utils.toBN(50)},
      {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}
    ]
    await expectRevert(token.transfer(tokenOwnerAccount, 50, {from: arbitraryAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt024 should fail to transfer when paused', async function () {
    await token.increaseMinterAllowance(minterAccount, amount, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(arbitraryAccount, 50, {from: minterAccount});
    await token.pause({from: pauserAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(amount - 50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': web3.utils.toBN(50)},
      {'variable': 'totalSupply', 'expectedValue': web3.utils.toBN(50)},
      {'variable': 'paused', 'expectedValue': true}
    ]
    await expectRevert(token.transfer(tokenOwnerAccount, 50, {from: arbitraryAccount}));
    await checkVariables([token], [customVars]);
  });

  // IncreaseMinterAllowance

  it('nt026 should fail to increaseMinterAllowance when sender is not masterMinter', async function () {
    assert.isFalse(arbitraryAccount == masterMinterAccount);
    await expectRevert(token.increaseMinterAllowance(minterAccount, amount, {from: arbitraryAccount}));
    await checkVariables([token], [[]]);
  });

  // DecreaseMinterAllowance

  it('nt029 should fail to decreaseMinterAllowance when sender is not masterMinter', async function () {
    await token.increaseMinterAllowance(minterAccount, amount, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(amount)}
    ]
    await expectRevert(token.decreaseMinterAllowance(minterAccount, amount, {from: arbitraryAccount}));
    await checkVariables([token], [customVars]);
  });

  // Burn

  it('nt031 should fail to burn when balance is less than amount', async function () {
    await token.increaseMinterAllowance(minterAccount, amount, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(amount)}
    ]
    await expectRevert(token.burn(amount, {from: minterAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt032 should fail to burn when amount is -1', async function () {
    await token.increaseMinterAllowance(minterAccount, amount, {from: masterMinterAccount});
    // Need to mint 1 less to retain minter status so that you can test burn of -1. 
    await token.mint(minterAccount, amount - 1, {from: minterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(1)},
      {'variable': 'balances.minterAccount', 'expectedValue': web3.utils.toBN(amount - 1)},
      {'variable': 'totalSupply', 'expectedValue': web3.utils.toBN(amount - 1)}
    ]
    await expectRevert(token.burn(-1, {from: minterAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt033 should fail to burn when sender is blacklisted', async function () {
    await token.increaseMinterAllowance(minterAccount, amount, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(minterAccount, 50, {from: minterAccount});
    await token.blacklist(minterAccount, {from: blacklisterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(amount - 50)},
      {'variable': 'balances.minterAccount', 'expectedValue': web3.utils.toBN(50)},
      {'variable': 'totalSupply', 'expectedValue': web3.utils.toBN(50)},
      {'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true}
    ]
    await expectRevert(token.burn(50, {from: minterAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt034 should fail to burn when paused', async function () {
    await token.increaseMinterAllowance(minterAccount, amount, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(minterAccount, 50, {from: minterAccount});
    await token.pause({from: pauserAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(amount - 50)},
      {'variable': 'balances.minterAccount', 'expectedValue': web3.utils.toBN(50)},
      {'variable': 'totalSupply', 'expectedValue': web3.utils.toBN(50)},
      {'variable': 'paused', 'expectedValue': true}
    ]
    await expectRevert(token.burn(50, {from: minterAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt035 should fail to burn when sender is not minter', async function () {
    await token.increaseMinterAllowance(minterAccount, amount, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(minterAccount, 50, {from: minterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(amount - 50)},
      {'variable': 'balances.minterAccount', 'expectedValue': web3.utils.toBN(50)},
      {'variable': 'totalSupply', 'expectedValue': web3.utils.toBN(50)}
    ]
    await expectRevert(token.burn(50, {from: arbitraryAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt036 should fail to burn after decreaseMinterAllowance', async function () {
    await token.increaseMinterAllowance(minterAccount, amount, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(minterAccount, 50, {from: minterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(amount - 50)},
      {'variable': 'balances.minterAccount', 'expectedValue': web3.utils.toBN(50)},
      {'variable': 'totalSupply', 'expectedValue': web3.utils.toBN(50)}
    ]
    await checkVariables([token], [customVars]);

    await token.decreaseMinterAllowance(minterAccount, amount - 50, {from: masterMinterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': false},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(0)},
      {'variable': 'balances.minterAccount', 'expectedValue': web3.utils.toBN(50)},
      {'variable': 'totalSupply', 'expectedValue': web3.utils.toBN(50)}
    ]
    await expectRevert(token.burn(50, {from: minterAccount}));
    await checkVariables([token], [customVars]);
  });

  // Update functions

  it('nt050 should fail to updatePauser when sender is not owner', async function () {
    await expectRevert(token.updatePauser(arbitraryAccount, {from: pauserAccount}));
    await checkVariables([token], [[]]);
  });

  it('nt049 should fail to updateMasterMinter when sender is not owner', async function () {
    await expectRevert(token.updateMasterMinter(arbitraryAccount, {from: pauserAccount}));
    await checkVariables([token], [[]]);
  });

  it('nt048 should fail to updateBlacklister when sender is not owner', async function () {
    await expectRevert(token.updateBlacklister(arbitraryAccount, {from: pauserAccount}));
    await checkVariables([token], [[]]);
  });

  // Pause and Unpause

  it('nt040 should fail to pause when sender is not pauser', async function () {
    await expectRevert(token.pause({from: arbitraryAccount}));
    await checkVariables([token], [[]]);
  });

  it('nt041 should fail to unpause when sender is not pauser', async function () {
    await token.pause({from: pauserAccount});
    customVars = [
      {'variable': 'paused', 'expectedValue': true}
    ]
    await expectRevert(token.unpause({from: arbitraryAccount}));
    await checkVariables([token], [customVars]);
  });

  // Blacklist and Unblacklist

  it('nt042 should fail to blacklist when sender is not blacklister', async function () {
    await expectRevert(token.blacklist(tokenOwnerAccount, {from: arbitraryAccount}));
    await checkVariables([token], [[]]);
  });

  it('nt043 should fail to unblacklist when sender is not blacklister', async function () {
    await token.blacklist(arbitraryAccount, {from: blacklisterAccount});
    customVars = [
      {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}
    ]
    await expectRevert(token.unBlacklist(arbitraryAccount, {from: tokenOwnerAccount}));
    await checkVariables([token], [customVars]);
  });

  // Upgrade

  it('nt054 should fail to transferOwnership when sender is not owner', async function() {
    // Create upgraded token
    var newRawToken = await UpgradedFiatToken.new();
    var tokenConfig = await upgradeTo(proxy, newRawToken);
    var newProxiedToken = tokenConfig.token;
    var newToken = newProxiedToken;

    var newToken_result = [
      { 'variable': 'proxiedTokenAddress', 'expectedValue': newRawToken.address }
    ];

    // expectRevert on transferOwnership with wrong sender
    await expectRevert(newToken.transferOwnership(arbitraryAccount, {from: arbitraryAccount2}));
    await checkVariables([newToken], [newToken_result]);
  });

  it('nt055 should fail to mint when amount = 0', async function() {
    await token.increaseMinterAllowance(minterAccount, amount, {from: masterMinterAccount});
    await expectRevert(token.mint(pauserAccount, 0, {from: minterAccount}));

    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(amount)}
    ]
    await checkVariables([token], [customVars]);
  });

  it('nt056 should fail to burn when amount = 0', async function() {
    await token.increaseMinterAllowance(minterAccount, amount, {from: masterMinterAccount});
    // Need to mint 1 less to retain minter status so that you can test burn of 0. 
    await token.mint(minterAccount, amount - 1, {from: minterAccount});
    await expectRevert(token.burn(0, {from: minterAccount}));
    // Need to use up mint allowance because the building of expected state fails
    await token.mint(minterAccount, 1, {from: minterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': false},
      {'variable': 'balances.minterAccount', 'expectedValue': web3.utils.toBN(amount)},
      {'variable': 'totalSupply', 'expectedValue': web3.utils.toBN(amount)}
    ]
    await checkVariables([token], [customVars]);
  });
  // No tests for 0x0, "0x0", 0, 0x0000000000000000000000000000000000000000
  // 0x0 and "0x0" are invalid addresses https://github.com/ethereum/web3.js/blob/59aae306c1c31ef6a65b9196e7f03af74c69e059/lib/web3/formatters.js#L265
  // truffle treats 0 as accounts[0]
  // 0x0000000000000000000000000000000000000000 is intepreted as 0 (number).
  it('nt064 transferOwnership should fail on "0x0000000000000000000000000000000000000000"', async function () {
    await expectRevert(token.transferOwnership(longZero, { from: tokenOwnerAccount }));
  });

  it('nt057 updateMasterMinter should fail on "0x0000000000000000000000000000000000000000"', async function () {
    await expectRevert(token.updateMasterMinter(longZero, { from: tokenOwnerAccount }));
  });

  it('nt058 updatePauser should fail on "0x0000000000000000000000000000000000000000"', async function () {
    await expectRevert(token.updatePauser(longZero, { from: tokenOwnerAccount }));
  });

  it('nt059 updateBlacklister should fail on "0x0000000000000000000000000000000000000000"', async function () {
    await expectRevert(token.updateBlacklister(longZero, { from: tokenOwnerAccount }));
  });

  it('nt060 initialize should fail when _masterMinter is "0x0000000000000000000000000000000000000000"', async function () {
    rawToken = await newToken();
    await expectRevert(customInitializeTokenWithProxy(rawToken, longZero, pauserAccount, blacklisterAccount, tokenOwnerAccount, delegateAccount));
  });

  it('nt061 initialize should fail when _pauser is "0x0000000000000000000000000000000000000000"', async function () {
    rawToken = await newToken();
    await expectRevert(customInitializeTokenWithProxy(rawToken, masterMinterAccount, longZero, blacklisterAccount, tokenOwnerAccount, delegateAccount));
  });

  it('nt062 initialize should fail when _blacklister is "0x0000000000000000000000000000000000000000"', async function () {
    rawToken = await newToken();
    await expectRevert(customInitializeTokenWithProxy(rawToken, masterMinterAccount, pauserAccount, longZero, tokenOwnerAccount, delegateAccount));
  });

  it('nt063 initialize should fail when _owner is "0x0000000000000000000000000000000000000000"', async function () {
    rawToken = await newToken();
    await expectRevert(customInitializeTokenWithProxy(rawToken, masterMinterAccount, pauserAccount, blacklisterAccount, longZero, delegateAccount));
  });

  // LawEnforcementWipingBurn

  it('nt064 lawEnforcementWipingBurn should fail when contract is paused', async function () {
    var mintAmount = 11;
    var burnAmount = 10;

    await token.increaseMinterAllowance(minterAccount, mintAmount, { from: masterMinterAccount });
    await token.mint(minterAccount, burnAmount, { from: minterAccount });
    await token.blacklist(minterAccount, { from: blacklisterAccount });
    await token.pause({from: pauserAccount});
    var setup = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(1) },
      { 'variable': 'balances.minterAccount', 'expectedValue': web3.utils.toBN(burnAmount) },
      { 'variable': 'totalSupply', 'expectedValue': web3.utils.toBN(burnAmount) },
      { 'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true },
      {'variable': 'paused', 'expectedValue': true}
    ];
    await checkVariables([token], [setup]);
    await expectRevert(token.lawEnforcementWipingBurn(minterAccount, { from: blacklisterAccount }));  
  });

  it('nt065 lawEnforcementWipingBurn should fail when non blacklister calls it and contract is paused', async function () {
    var mintAmount = 11;
    var burnAmount = 10;

    await token.increaseMinterAllowance(minterAccount, mintAmount, { from: masterMinterAccount });
    await token.mint(minterAccount, burnAmount, { from: minterAccount });
    await token.blacklist(minterAccount, { from: blacklisterAccount });
    await token.pause({from: pauserAccount});
    var setup = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(1) },
      { 'variable': 'balances.minterAccount', 'expectedValue': web3.utils.toBN(burnAmount) },
      { 'variable': 'totalSupply', 'expectedValue': web3.utils.toBN(burnAmount) },
      { 'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true },
      {'variable': 'paused', 'expectedValue': true}
    ];
    await checkVariables([token], [setup]);
    await expectRevert(token.lawEnforcementWipingBurn(minterAccount, { from: arbitraryAccount }));
  });

  it('nt066 lawEnforcementWipingBurn should fail when non blacklister calls it and contract is not paused', async function () {
    var mintAmount = 11;
    var burnAmount = 10;

    await token.increaseMinterAllowance(minterAccount, mintAmount, { from: masterMinterAccount });
    await token.mint(minterAccount, burnAmount, { from: minterAccount });
    await token.blacklist(minterAccount, { from: blacklisterAccount });
    var setup = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(1) },
      { 'variable': 'balances.minterAccount', 'expectedValue': web3.utils.toBN(burnAmount) },
      { 'variable': 'totalSupply', 'expectedValue': web3.utils.toBN(burnAmount) },
      { 'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true }
    ];
    await checkVariables([token], [setup]);
    await expectRevert(token.lawEnforcementWipingBurn(minterAccount, { from: arbitraryAccount }));
  });
  
  it('nt067 lawEnforcementWipingBurn should fail when blacklister tries to wipe a non blacklisted address', async function () {
    var mintAmount = 11;
    var burnAmount = 10;

    await token.increaseMinterAllowance(minterAccount, mintAmount, { from: masterMinterAccount });
    await token.mint(minterAccount, burnAmount, { from: minterAccount });
    await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
    var setup = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(1) },
      { 'variable': 'balances.minterAccount', 'expectedValue': web3.utils.toBN(burnAmount) },
      { 'variable': 'totalSupply', 'expectedValue': web3.utils.toBN(burnAmount) },
      { 'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': false },
      { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true },

    ];
    await checkVariables([token], [setup]);
    await expectRevert(token.lawEnforcementWipingBurn(minterAccount, { from: blacklisterAccount }));  
  });

  // ReclaimToken

  it('nt068 reclaimToken should fail when non owner calls it', async function () {
    var mintAmount = 10;

    await token.increaseMinterAllowance(minterAccount, mintAmount, { from: masterMinterAccount });
    await token.mint(minterAccount, mintAmount, { from: minterAccount });
    await token.transfer(token.address, mintAmount, { from: minterAccount });
    var setup = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': web3.utils.toBN(0) },
      { 'variable': 'balances.minterAccount', 'expectedValue': web3.utils.toBN(0) },
      { 'variable': 'balances.tokenContractAccount', 'expectedValue': web3.utils.toBN(10) },
      { 'variable': 'totalSupply', 'expectedValue': web3.utils.toBN(mintAmount) },
    ];
    await checkVariables([token], [setup]);
    await expectRevert(token.reclaimToken(token.address, { from: arbitraryAccount }));
  });

  it('nt069 reclaimToken should fail when token owner calls it with tokenAddress "0x0000000000000000000000000000000000000000"', async function () {
    await expectRevert(token.reclaimToken(longZero, { from: tokenOwnerAccount }));
  });


}

var testWrapper = require('./TestWrapper');
testWrapper.execute('FiatToken_NegativeTests', run_tests);

module.exports = {
  run_tests: run_tests,
}
