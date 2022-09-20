var tokenUtils = require('./TokenTestUtils');
var name = tokenUtils.name;
var symbol = tokenUtils.symbol;
var currency = tokenUtils.currency;
var decimals = tokenUtils.decimals
var BN = require('bn.js');
var bigZero = tokenUtils.bigZero;
var bigHundred = tokenUtils.bigHundred;
var mint = tokenUtils.mint;
var burn = tokenUtils.burn;
var setMinter = tokenUtils.setMinter;
var expectRevert = tokenUtils.expectRevert;
var blacklist = tokenUtils.blacklist;
var sampleTransferFrom = tokenUtils.sampleTransferFrom;
var increaseAllowance = tokenUtils.increaseAllowance;
var unBlacklist = tokenUtils.unBlacklist;
var sampleTransfer = tokenUtils.sampleTransfer;
var checkTransferEvents = tokenUtils.checkTransferEvents;
var deployerAccount = tokenUtils.deployerAccount;
var arbitraryAccount = tokenUtils.arbitraryAccount;
var tokenOwnerAccount = tokenUtils.tokenOwnerAccount;
var blacklisterAccount = tokenUtils.blacklisterAccount;
var arbitraryAccount2 = tokenUtils.arbitraryAccount2;
var masterMinterAccount = tokenUtils.masterMinterAccount;
var minterAccount = tokenUtils.minterAccount;
var pauserAccount = tokenUtils.pauserAccount;
var blacklisterAccount = tokenUtils.blacklisterAccount;
var proxyOwnerAccount = tokenUtils.proxyOwnerAccount;
var initializeTokenWithProxy = tokenUtils.initializeTokenWithProxy;
var upgradeTo = tokenUtils.upgradeTo;
var UpgradedFiatToken = tokenUtils.UpgradedFiatToken;
var FiatToken = tokenUtils.FiatToken;
var getAdmin = tokenUtils.getAdmin;

// these tests are for reference and do not track side effects on all variables
async function run_tests(newToken, accounts) {

  beforeEach(async function () {
    rawToken =  await FiatToken.new();
    var tokenConfig = await initializeTokenWithProxy(rawToken);
    proxy = tokenConfig.proxy;
    token = tokenConfig.token;
    assert.equal(proxy.address, token.address);
  });

  it('should start with a totalSupply of 0', async function () {
    let totalSupply = await token.totalSupply();
    assert.isTrue(web3.utils.toBN(totalSupply).eq(web3.utils.toBN(0)));
  });

  it('should add multiple mints to a given address in address balance', async function () {
    await mint(token, accounts[0], 100, minterAccount);
    await mint(token, accounts[0], 200, minterAccount);

    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 300);
  });

  // No tests for 0x0, "0x0", 0, 0x0000000000000000000000000000000000000000
  // 0x0 and "0x0" are invalid addresses https://github.com/ethereum/web3.js/blob/59aae306c1c31ef6a65b9196e7f03af74c69e059/lib/web3/formatters.js#L265
  // truffle treats 0 as accounts[0]
  // 0x0000000000000000000000000000000000000000 is intepreted as 0 (number).
  it('should fail to mint to a null address', async function () {
    let initialTotalSupply = await token.totalSupply();
    await expectRevert(mint(token, "0x0000000000000000000000000000000000000000", 100, minterAccount));
    totalSupply = await token.totalSupply();
    assert.isTrue(web3.utils.toBN(totalSupply).eq(web3.utils.toBN(initialTotalSupply)));
  });

  it('should add multiple mints to a given address in address balance', async function () {
    await mint(token, accounts[0], 100, minterAccount);
    await mint(token, accounts[0], 200, minterAccount);

    let balance0 = await token.balanceOf(accounts[0]);
    assert.isTrue(web3.utils.toBN(balance0).eq(web3.utils.toBN(300)));
  });

  it('should add multiple mints to total supply', async function () {
    let initialTotalSupply = await token.totalSupply();
    await mint(token, accounts[0], 100, minterAccount);
    await mint(token, accounts[0], 400, minterAccount);
    await mint(token, accounts[1], 600, minterAccount);

    let totalSupply = await token.totalSupply();
    assert.isTrue(web3.utils.toBN(totalSupply).sub(web3.utils.toBN(initialTotalSupply)).eq(web3.utils.toBN(1100)));
  });

  it('should fail to mint from blacklisted minter', async function () {
    await setMinter(token, accounts[2], 200);
    await blacklist(token, accounts[2]);

    await expectRevert(token.mint(accounts[0], 100, { from: accounts[2] }));

    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 0);
  });

  it('should fail to mint to blacklisted address', async function () {
    await blacklist(token, accounts[3]);

    await expectRevert(mint(token, accounts[3], 100, minterAccount))

    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 0);
  });

  it('should fail to mint from a non-minter call', async function () {
    await mint(token, accounts[0], 400, minterAccount);

    await expectRevert(token.mint(accounts[0], 100, { from: accounts[0] }))

    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 400);
  });

  it('should complete transferFrom', async function () {
    await sampleTransferFrom(token, deployerAccount, arbitraryAccount2, minterAccount);
  });

  it('should approve', async function () {
    await increaseAllowance(token, accounts[3], 100, accounts[2]);
    let allowance = await token.allowance(accounts[2], accounts[3]);
    assert.isTrue(web3.utils.toBN(allowance).eq(web3.utils.toBN(100)));
  });

  it('should complete sample transfer', async function () {
    await sampleTransfer(token, deployerAccount, arbitraryAccount2, minterAccount);
  });

  it('should complete transfer from non-owner', async function () {
    await mint(token, accounts[2], 1900, minterAccount);
    let transfer = await token.transfer(accounts[3], 1000, { from: accounts[2] });

    checkTransferEvents(transfer, accounts[2], accounts[3], 1000);

    let balance0 = await token.balanceOf(accounts[2]);
    assert.equal(balance0, 1900 - 1000);
    let balance3 = await token.balanceOf(accounts[3]);
    assert.equal(balance3, 1000);
  });

  it('should set allowance and balances before and after approved transfer', async function () {
    let allowed = await token.allowance(accounts[0], accounts[3]);
    assert.isTrue(web3.utils.toBN(allowed).eq(web3.utils.toBN(0)));
    await mint(token, accounts[0], 500, minterAccount);
    await token.increaseAllowance(accounts[3], 100);
    allowed = await token.allowance(accounts[0], accounts[3]);
    assert.isTrue(web3.utils.toBN(allowed).eq(web3.utils.toBN(100)));

    let transfer = await token.transferFrom(accounts[0], accounts[3], 50, { from: accounts[3] });

    checkTransferEvents(transfer, accounts[0], accounts[3], 50);

    let balance0 = await token.balanceOf(accounts[0]);
    assert.isTrue(web3.utils.toBN(balance0).eq(web3.utils.toBN(450)));
    let balance3 = await token.balanceOf(accounts[3]);
    assert.isTrue(web3.utils.toBN(balance3).eq(web3.utils.toBN(50)));
  });

  it('should fail on unauthorized approved transfer and not change balances', async function () {
    let allowed = await token.allowance(accounts[0], accounts[3]);
    assert.isTrue(web3.utils.toBN(allowed).eq(web3.utils.toBN(0)));
    await mint(token, accounts[0], 500, minterAccount);
    await token.increaseAllowance(accounts[3], 100);
    allowed = await token.allowance(accounts[0], accounts[3]);
    assert.isTrue(web3.utils.toBN(allowed).eq(web3.utils.toBN(100)));

    await expectRevert(token.transferFrom(accounts[0], accounts[3], 50, { from: accounts[4] }));

    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 500);
    let balance3 = await token.balanceOf(accounts[3]);
    assert.equal(balance3, 0);
  });

  it('should fail on invalid approved transfer amount and not change balances', async function () {
    let allowed = await token.allowance(accounts[0], accounts[3]);
    assert.isTrue(web3.utils.toBN(allowed).eq(web3.utils.toBN(0)));
    await mint(token, accounts[0], 500, minterAccount);
    await token.increaseAllowance(accounts[3], 100);
    allowed = await token.allowance(accounts[0], accounts[3]);
    assert.isTrue(web3.utils.toBN(allowed).eq(web3.utils.toBN(100)));

    await expectRevert(token.transferFrom(accounts[0], accounts[3], 450, { from: accounts[3] }));

    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 500);
    let balance3 = await token.balanceOf(accounts[3]);
    assert.equal(balance3, 0);

  });

  it('should fail on invalid transfer recipient (zero-account) and not change balances', async function () {

    await mint(token, accounts[0], 500, minterAccount);
    await token.increaseAllowance(accounts[3], 100);
    let allowed = await token.allowance(accounts[0], accounts[3]);
    assert.isTrue(web3.utils.toBN(allowed).eq(web3.utils.toBN(100)));

    await expectRevert(token.transferFrom(accounts[0], "0x0000000000000000000000000000000000000000", 50, { from: accounts[3] }));
    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 500);
  });

  it('should test consistency of transfer(x) and approve(x) + transferFrom(x)', async function () {
    let allowed = await token.allowance(accounts[0], accounts[3]);
    assert.isTrue(web3.utils.toBN(allowed).eq(web3.utils.toBN(0)));
    let transferAmount = 650;
    let totalAmount = transferAmount;
    await mint(token, accounts[0], totalAmount, minterAccount);

    let transfer = await token.transfer(accounts[3], transferAmount);
    checkTransferEvents(transfer, accounts[0], accounts[3], transferAmount);

    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, totalAmount - transferAmount);
    let balance3 = await token.balanceOf(accounts[3]);
    assert.equal(balance3, transferAmount);

    await token.allowance(accounts[1], accounts[4]);
    assert.isTrue(web3.utils.toBN(allowed).eq(web3.utils.toBN(0)));
    await mint(token, accounts[1], totalAmount, minterAccount);

    await token.increaseAllowance(accounts[4], transferAmount, { from: accounts[1] });
    allowed = await token.allowance(accounts[1], accounts[4]);
    assert.isTrue(web3.utils.toBN(allowed).eq(web3.utils.toBN(transferAmount)));

    transfer = await token.transferFrom(accounts[1], accounts[4], transferAmount, { from: accounts[4] });

    checkTransferEvents(transfer, accounts[1], accounts[4], transferAmount);

    let balance1 = await token.balanceOf(accounts[1]);
    assert.equal(balance0, totalAmount - transferAmount);
    let balance4 = await token.balanceOf(accounts[4]);
    assert.equal(balance3, transferAmount);
  });

  it('should pause and should not be able to transfer', async function () {
    await mint(token, accounts[2], 1900, minterAccount);
    assert.equal(await token.paused.call(), false);
    await token.pause({ from: pauserAccount });
    assert.equal(await token.paused.call(), true);

    await expectRevert(sampleTransferFrom(token, deployerAccount, arbitraryAccount2, minterAccount));
  });

  it('should pause and should not be able to transfer, then unpause and be able to transfer', async function () {
    await mint(token, accounts[2], 1900, minterAccount);
    assert.equal(await token.paused.call(), false);
    await token.pause({ from: pauserAccount });
    assert.equal(await token.paused.call(), true);
    await expectRevert(sampleTransferFrom(token, deployerAccount, arbitraryAccount2, minterAccount));

    await token.unpause({ from: pauserAccount });
    assert.equal(await token.paused.call(), false);
    await sampleTransferFrom(token, deployerAccount, arbitraryAccount2, minterAccount);
  });

  it('should pause and should not be able to transferFrom', async function () {
    await mint(token, accounts[2], 1900, minterAccount);
    assert.equal(await token.paused.call(), false);
    await token.pause({ from: pauserAccount });
    assert.equal(await token.paused.call(), true);

    await expectRevert(sampleTransfer(token, deployerAccount, arbitraryAccount2, minterAccount));
  });

  it('should pause and should not be able to approve', async function () {
    await mint(token, accounts[2], 1900, minterAccount);
    assert.equal(await token.paused.call(), false);
    await token.pause({ from: pauserAccount });
    assert.equal(await token.paused.call(), true);

    await expectRevert(increaseAllowance(token, accounts[2], 50, accounts[3]));
  });

  it('should pause and should not be able to mint', async function () {
    await mint(token, accounts[2], 1900, minterAccount);
    assert.equal(await token.paused.call(), false);
    await token.pause({ from: pauserAccount });
    assert.equal(await token.paused.call(), true);

    await expectRevert(mint(token, accounts[2], 1900, minterAccount));
  });

  it('should try to pause with non-pauser and fail to pause', async function () {
    await mint(token, accounts[2], 1900, minterAccount);
    assert.equal(await token.paused.call(), false);

    await expectRevert(token.pause({ from: accounts[0] }));

    assert.equal(await token.paused.call(), false);
  });

  it('should try to pause with non-pauser and fail to pause', async function () {
    await mint(token, accounts[2], 1900, minterAccount);
    assert.equal(await token.paused.call(), false);

    await expectRevert(token.pause({ from: accounts[0] }));

    assert.equal(await token.paused.call(), false);
  });

  it('should increase allowance and fail to transfer more than balance', async function () {
    await mint(token, accounts[2], 100, minterAccount);
    await token.increaseAllowance(accounts[1], 600, { from: accounts[2] });

    await expectRevert(token.transferFrom(accounts[2], accounts[1], 600, { from: accounts[1] }));

    let balance = await token.balanceOf(accounts[2]);
    assert.isTrue(web3.utils.toBN(balance).eq(web3.utils.toBN(100)));
  });

  it('should blacklist and make transfer impossible', async function () {
    await mint(token, accounts[2], 1900, minterAccount);
    await blacklist(token, accounts[2]);

    await expectRevert(token.transfer(accounts[3], 600, { from: accounts[2] }));

    let balance = await token.balanceOf(accounts[2]);
    assert.equal(balance, 1900);
  });

  it('should blacklist recipient and make transfer to recipient impossible', async function () {
    await mint(token, accounts[2], 1900, minterAccount);
    await mint(token, accounts[9], 1600, minterAccount);
    await blacklist(token, accounts[2]);

    await expectRevert(token.transfer(accounts[2], 600, { from: accounts[9] }));

    let balance = await token.balanceOf(accounts[2]);
    assert.isTrue(web3.utils.toBN(balance).eq(web3.utils.toBN(1900)));
    balance = await token.balanceOf(accounts[9]);
    assert.isTrue(web3.utils.toBN(balance).eq(web3.utils.toBN(1600)));
  });

  it('should blacklist and make transferFrom impossible with the approved transferer', async function () {
    let isBlacklistedBefore = await token.isBlacklisted(accounts[2])
    assert.equal(isBlacklistedBefore, false);

    await mint(token, accounts[2], 1900, minterAccount);
    await token.increaseAllowance(accounts[1], 600, { from: accounts[2] });
    await blacklist(token, accounts[2]);

    await expectRevert(token.transferFrom(accounts[2], accounts[3], 600, { from: accounts[1] }));

    let balance = await token.balanceOf(accounts[2]);
    assert.isTrue(web3.utils.toBN(balance).eq(web3.utils.toBN(1900)));

    let isBlacklistedAfter = await token.isBlacklisted(accounts[2]);
    assert.equal(isBlacklistedAfter, true);
  });

  it('should make transferFrom impossible with the approved and blacklisted transferer', async function () {
    await mint(token, accounts[2], 1900, minterAccount);
    await token.increaseAllowance(accounts[1], 600, { from: accounts[2] });
    await blacklist(token, accounts[1]);

    await expectRevert(token.transferFrom(accounts[2], accounts[3], 600, { from: accounts[1] }));

    let balance = await token.balanceOf(accounts[2]);
    assert.isTrue(web3.utils.toBN(balance).eq(web3.utils.toBN(1900)));
  });

  it('should blacklist recipient and make transfer to recipient using transferFrom impossible', async function () {
    await mint(token, accounts[2], 1900, minterAccount);
    await token.increaseAllowance(accounts[3], 600, { from: accounts[2] });
    await blacklist(token, accounts[3]);

    await expectRevert(token.transferFrom(accounts[2], accounts[3], 600, { from: accounts[2] }));

    let balance = await token.balanceOf(accounts[2]);
    assert.isTrue(web3.utils.toBN(balance).eq(web3.utils.toBN(1900)));
  });

  it('should blacklist and make increase allowance impossible', async function () {
    await mint(token, accounts[1], 1900, minterAccount);
    await blacklist(token, accounts[1]);

    await expectRevert(token.increaseAllowance(accounts[2], 600, { from: accounts[1] }));
    let approval = await token.allowance(accounts[1], accounts[2]);
    assert.isTrue(web3.utils.toBN(approval).eq(web3.utils.toBN(0)));
  });

  it('should make increasing allowance to blacklisted account impossible', async function () {
    await mint(token, accounts[2], 1900, minterAccount);
    await blacklist(token, accounts[1]);

    await expectRevert(token.increaseAllowance(accounts[1], 600, { from: accounts[2] }));

    let approval = await token.allowance(accounts[2], accounts[1]);
    assert.isTrue(web3.utils.toBN(approval).eq(web3.utils.toBN(0)));
  });

  it('should blacklist then unblacklist to make a transfer possible', async function () {
    await mint(token, accounts[2], 1900, minterAccount);
    await blacklist(token, accounts[2]);
    await unBlacklist(token, accounts[2]);
    await token.transfer(accounts[3], 600, { from: accounts[2] });
    let balance = await token.balanceOf(accounts[2]);
    assert.isTrue(web3.utils.toBN(balance).eq(web3.utils.toBN(1300)));
    balance = await token.balanceOf(accounts[3]);
    assert.isTrue(web3.utils.toBN(balance).eq(web3.utils.toBN(600)));
  });

  it('should fail to blacklist with non-blacklister account', async function () {
    await mint(token, accounts[2], 1900, minterAccount);

    await expectRevert(token.blacklist(accounts[2], { from: pauserAccount }));

    await token.transfer(accounts[3], 600, { from: accounts[2] });
    let balance = await token.balanceOf(accounts[2]);
    assert.isTrue(web3.utils.toBN(balance).eq(web3.utils.toBN(1300)));
    balance = await token.balanceOf(accounts[3]);
    assert.isTrue(web3.utils.toBN(balance).eq(web3.utils.toBN(600)));
  });

  it('should unblacklist when paused', async function () {
    await mint(token, accounts[2], 1900, minterAccount);
    await token.blacklist(accounts[2], { from: blacklisterAccount });
    let blacklisted = await token.isBlacklisted(accounts[2]);
    assert.isTrue(blacklisted);

    await token.pause({ from: pauserAccount });

    await token.unBlacklist(accounts[2], { from: blacklisterAccount });

    blacklisted = await token.isBlacklisted(accounts[2]);
    assert.isFalse(blacklisted);

    let balance = await token.balanceOf(accounts[2]);
    assert.isTrue(web3.utils.toBN(balance).eq(web3.utils.toBN(1900)));
  });

  it('should change the minter and mint as well as fail to mint with the old minter', async function () {
    await setMinter(token, minterAccount, 200);
    let update = await token.decreaseMinterAllowance(minterAccount, 200, { from: masterMinterAccount });
    assert.equal(update.logs[0].event, 'MinterRemoved');
    assert.equal(update.logs[0].args.oldMinter, minterAccount);
    update = await setMinter(token, accounts[3], 10000, { from: masterMinterAccount });
    await token.mint(accounts[1], 100, { from: accounts[3] });

    await expectRevert(token.mint(accounts[1], 200, { from: minterAccount }));

    let isMinter = await token.isMinter(minterAccount);
    assert.equal(isMinter, false);
    let balance = await token.balanceOf(accounts[1]);
    assert.equal(balance, 100);
  });

  it('should remove a minter even if the contract is paused', async function () {
    await token.increaseMinterAllowance(accounts[3], 200, { from: masterMinterAccount });
    let isAccountMinter = await token.isMinter(accounts[3]);
    assert.equal(isAccountMinter, true);
    await token.pause({ from: pauserAccount });
    await token.decreaseMinterAllowance(accounts[3], 200, { from: masterMinterAccount });
    isAccountMinter = await token.isMinter(accounts[3]);
    assert.equal(isAccountMinter, false);
  });

  it('should pause contract even when contract is already paused', async function () {
    await token.pause({ from: pauserAccount });
    await token.pause({ from: pauserAccount });
    let isPaused = await token.paused();
    assert.equal(isPaused, true);
  });

  it('should unpause contract even when contract is already unpaused', async function () {
    await token.unpause({ from: pauserAccount });
    let isPaused = await token.paused();
    assert.equal(isPaused, false);
  });

  it('should fail to updateMinterAllowance from non-masterMinter', async function () {
    let minterAllowanceBefore = await token.minterAllowance(minterAccount)
    assert.equal(minterAllowanceBefore, 0);

    await expectRevert(token.increaseMinterAllowance(minterAccount, 100, { from: tokenOwnerAccount }));

    let minterAllowanceAfter = await token.minterAllowance(minterAccount)
    assert.equal(minterAllowanceAfter, 0);
  });

  it('should have correct name', async function () {
    let actual = await token.name.call();
    assert.equal(actual, name);
  });

  it('should have correct symbol', async function () {
    let actual = await token.symbol.call();
    assert.equal(actual, symbol);
  });

  it('should have correct decimals', async function () {
    let actual = await token.decimals.call();
    assert.equal(actual, decimals);
  });

  it('should mint and burn tokens', async function () {
    let burnerAddress = accounts[3];
    let amount = 500;
    await setMinter(token, burnerAddress, amount);
    let totalSupply = await token.totalSupply();
    let minterBalance = await token.balanceOf(burnerAddress);
    assert.isTrue(web3.utils.toBN(totalSupply).eq(web3.utils.toBN(0)));
    assert.isTrue(web3.utils.toBN(minterBalance).eq(web3.utils.toBN(0)));

    // mint tokens to burnerAddress
    await mint(token, burnerAddress, amount, minterAccount);
    let totalSupply1 = await token.totalSupply();
    let minterBalance1 = await token.balanceOf(burnerAddress);
    assert.isTrue(web3.utils.toBN(totalSupply1).eq(web3.utils.toBN(totalSupply).add(web3.utils.toBN(amount))));
    assert.isTrue(web3.utils.toBN(minterBalance1).eq(web3.utils.toBN(minterBalance).add(web3.utils.toBN(amount))));

    // burn tokens
    await burn(token, amount, burnerAddress);
    let totalSupply2 = await token.totalSupply();
    assert.isTrue(web3.utils.toBN(totalSupply2).eq(web3.utils.toBN(totalSupply1).sub(web3.utils.toBN(amount))));

    // check that minter's balance has been reduced
    let minterBalance2 = await token.balanceOf(burnerAddress);
    assert.isTrue(web3.utils.toBN(minterBalance2).eq(web3.utils.toBN(minterBalance1).sub(web3.utils.toBN(amount))));
  });

  it('should try to burn tokens from a non-minter and fail', async function () {
    let burnerAddress = accounts[3];
    let amount = 1000;

    await expectRevert(token.burn(amount, { from: burnerAddress }));
  });

  it('should fail to burn from a blacklisted address', async function () {
    let burnerAddress = accounts[3];
    await setMinter(token, burnerAddress, 200);
    await mint(token, burnerAddress, 200, minterAccount);
    await blacklist(token, burnerAddress);

    await expectRevert(token.burn(100, { from: burnerAddress }));
    let balance0 = await token.balanceOf(burnerAddress);
    assert.equal(balance0, 200);
  });

  it('should try to burn more tokens than balance and fail', async function () {
    let burnerAddress = accounts[3];
    let amount = 500;
    await setMinter(token, burnerAddress, 250);
    await mint(token, burnerAddress, 100, minterAccount);

    await expectRevert(token.burn(amount, { from: burnerAddress }));
  });

  it('should upgrade and preserve data', async function () {
    await mint(token, accounts[2], 200, minterAccount);
    let initialBalance = await token.balanceOf(accounts[2]);
    assert.isTrue((web3.utils.toBN(initialBalance)).eq(web3.utils.toBN(200)));

    var newRawToken = await UpgradedFiatToken.new();
    var tokenConfig = await upgradeTo(proxy, newRawToken);
    var newProxiedToken = tokenConfig.token;
    var newToken = newProxiedToken;

    let upgradedBalance = await newToken.balanceOf(accounts[2]);
    assert.isTrue((web3.utils.toBN(upgradedBalance)).eq(web3.utils.toBN(200)));
    await newToken.increaseMinterAllowance(minterAccount, 500, { from: masterMinterAccount });
    await newToken.mint(accounts[2], 200, { from: minterAccount });
    let balance = await newToken.balanceOf(accounts[2]);
    assert.isTrue((web3.utils.toBN(balance)).eq(web3.utils.toBN(400)));
  });

  it('should updateRoleAddress for masterMinter', async function () {
    let address1 = accounts[7];
    let address2 = accounts[6];
    await token.updateMasterMinter(address1, { from: tokenOwnerAccount });
    let masterMinter1 = await token.masterMinter();
    assert.equal(masterMinter1, address1);

    await token.updateMasterMinter(address2, { from: tokenOwnerAccount });
    let masterMinter2 = await token.masterMinter();
    assert.equal(masterMinter2, address2);
  });

  it('should updateRoleAddress for blacklister', async function () {
    let address1 = accounts[7];
    let address2 = accounts[6];
    await token.updateBlacklister(address1, { from: tokenOwnerAccount });
    let blacklister1 = await token.blacklister();
    assert.equal(blacklister1, address1);

    await token.updateBlacklister(address2, { from: tokenOwnerAccount });
    let blacklister2 = await token.blacklister();
    assert.equal(blacklister2, address2);
  });

  it('should updateRoleAddress for pauser', async function () {
    let address1 = accounts[7];
    let address2 = accounts[6];
    await token.updatePauser(address1, { from: tokenOwnerAccount });
    let pauser1 = await token.pauser();
    assert.equal(pauser1, address1);

    await token.updatePauser(address2, { from: tokenOwnerAccount });
    let pauser2 = await token.pauser();
    assert.equal(pauser2, address2);
  });

  it('should updateUpgraderAddress for upgrader', async function () {
    let upgrader = await getAdmin(proxy);
    assert.equal(proxyOwnerAccount, upgrader);
    let address1 = accounts[10];
    let updated = await proxy.changeAdmin(address1, { from: proxyOwnerAccount });
    upgrader = await getAdmin(proxy);
    assert.equal(upgrader, address1);

    //Test upgrade with new upgrader account
    await token.increaseMinterAllowance(minterAccount, 1000, {from: masterMinterAccount});
    await token.mint(accounts[2], 200, {from: minterAccount});

    let initialBalance = await token.balanceOf(accounts[2]);
    assert.isTrue((web3.utils.toBN(initialBalance)).eq(web3.utils.toBN(200)));

    var newRawToken = await UpgradedFiatToken.new();
    var tokenConfig = await upgradeTo(proxy, newRawToken, address1);
    var newProxiedToken = tokenConfig.token;
    var newToken = newProxiedToken;

    let upgradedBalance = await newToken.balanceOf(accounts[2]);
    assert.isTrue((web3.utils.toBN(upgradedBalance)).eq(web3.utils.toBN(200)));
    await newToken.increaseMinterAllowance(minterAccount, 500, { from: masterMinterAccount });
    await newToken.mint(accounts[2], 200, { from: minterAccount });
    let balance = await newToken.balanceOf(accounts[2]);
    assert.isTrue((web3.utils.toBN(balance)).eq(web3.utils.toBN(400)));
  });

  it('should fail to updateUpgraderAddress for upgrader using non-upgrader account', async function () {
    let address1 = accounts[7];
    await expectRevert(proxy.changeAdmin(address1, { from: tokenOwnerAccount }));
    let upgrader = getAdmin(proxy);
    assert.notEqual(upgrader, address1);
  });

  it('should updateRoleAddress for roleAddressChanger', async function () {
    let address1 = accounts[7];
    let address2 = accounts[6];
    await token.transferOwnership(address1, { from: tokenOwnerAccount });
    let roleAddressChanger1 = await token.owner();
    assert.equal(roleAddressChanger1, address1);

    await token.transferOwnership(address2, { from: address1 });
    let roleAddressChanger2 = await token.owner();
    assert.equal(roleAddressChanger2, address2);
  });

  it('should fail to updateRoleAddress from a non-roleAddressChanger', async function () {
    let nonRoleAddressChanger = accounts[2];
    let address1 = accounts[7];

    await expectRevert(token.updateMasterMinter(address1, { from: nonRoleAddressChanger }));
  });
}

var testWrapper = require('./TestWrapper');
testWrapper.execute('FiatToken_LegacyTests', run_tests);

module.exports = {
  run_tests: run_tests,
}
