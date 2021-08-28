const DIDRegistry = artifacts.require('DIDRegistry');

contract('DIDRegistry', (accounts) => {
  it('should add verificationMethod', async () => {
    const verificationMethod = {
      name: web3.utils.asciiToHex(
        'vm/did:as2:0xabc53a335449ed76ab7963f80e61b1ea3d68c2e0/Secp256k1/am/hex',
      ),
      value: web3.utils.asciiToHex('0x000000000000000000000000000000001'),
    };
    const instance = await DIDRegistry.deployed();
    const change = await instance.setAttribute(
      accounts[0],
      verificationMethod.name,
      verificationMethod.value,
      342242344,
      { from: accounts[0] },
    );

    assert.lengthOf(change.logs, 1, 'No events emitted');

    return assert.include(
      change.logs[0].args,
      {
        identity: accounts[0],
        name: web3.utils.padRight(verificationMethod.name, 64),
        value: verificationMethod.value,
      },
      "DIDRegistry didn't add the Verification Method",
    );
  });
});
