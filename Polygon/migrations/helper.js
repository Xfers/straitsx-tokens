module.exports.tx = function(result, task) {
    const logs = (result.logs.length > 0) ? result.logs[0] : { address: null, event: null };
    console.log();
    console.log(`   ${task}`);
    console.log('   ------------------------');
    console.log(`   > transaction hash:    ${result.tx}`);
    console.log(`   > contract address:    ${logs.address}`);
    console.log(`   > gas used:            ${result.receipt.gasUsed}`);
    console.log(`   > event:               ${logs.event}`);
    console.log();
}