const DIDRegistry = artifacts.require('DIDRegistry');

const sleep = (seconds) =>
  new Promise((resolve) => setTimeout(resolve, seconds * 1e3));

contract('DIDRegistry', (accounts) => {
  it('should fail to add new controller', async () => {
    const instance = await DIDRegistry.deployed();
    try {
      await instance.addController(accounts[0], accounts[1], {
        from: accounts[1],
      });
    } catch (e) {
      return assert.equal(
        e.reason,
        'Not authorized',
        'DIDRegistry did add controller',
      );
    }
  });

  it('should add new controller', async () => {
    const instance = await DIDRegistry.deployed();
    await instance.addController(accounts[0], accounts[1], {
      from: accounts[0],
    });
    const controllers = await instance.getControllers();
    return assert.equal(
      controllers[1],
      accounts[1],
      "DIDRegistry didn't change controller",
    );
  });

  it('should not add registered controller', async () => {
    const instance = await DIDRegistry.deployed();
    await instance.addController(accounts[0], accounts[1], {
      from: accounts[0],
    });
    const controllers = await instance.getControllers();
    return assert.equal(
      controllers.length,
      2,
      "DIDRegistry didn't change controller",
    );
  });

  it('should fail to change controller', async () => {
    const instance = await DIDRegistry.deployed();
    try {
      await instance.changeController(accounts[0], accounts[2], {
        from: accounts[0],
      });
    } catch (e) {
      return assert.equal(
        e.reason,
        'Controller not exist',
        'DIDRegistry did change controller',
      );
    }
  });

  it('should change controller', async () => {
    const instance = await DIDRegistry.deployed();

    await instance.changeController(accounts[0], accounts[1], {
      from: accounts[0],
    });

    return assert.equal(
      await instance.identityController.call(accounts[0]),
      accounts[1],
      "DIDRegistry didn't change controller",
    );
  });

  it('should fail to remove controller', async () => {
    const instance = await DIDRegistry.deployed();

    try {
      await instance.removeController(accounts[0], accounts[1], {
        from: accounts[0],
      });
    } catch (e) {
      return assert.equal(
        e.reason,
        'Not authorized',
        'DIDRegistry did add controller',
      );
    }
  });

  it('should fail to remove current controller', async () => {
    const instance = await DIDRegistry.deployed();

    try {
      await instance.removeController(accounts[0], accounts[1], {
        from: accounts[1],
      });
    } catch (e) {
      return assert.equal(
        e.reason,
        'Cannot delete current controller',
        'DIDRegistry did add controller',
      );
    }
  });

  it('should fail to remove invalid controller', async () => {
    const instance = await DIDRegistry.deployed();

    try {
      await instance.removeController(accounts[0], accounts[4], {
        from: accounts[1],
      });
    } catch (e) {
      return assert.equal(
        e.reason,
        'Controller not exist',
        'DIDRegistry did add controller',
      );
    }
  });

  it('should remove controller', async () => {
    const instance = await DIDRegistry.deployed();

    await instance.removeController(accounts[0], accounts[0], {
      from: accounts[1],
    });

    const controllers = await instance.getControllers();
    return assert.equal(
      controllers.length,
      1,
      "DIDRegistry didn't change controller",
    );
  });

  it('should do automatic key rotation', async () => {
    const instance = await DIDRegistry.deployed();

    const newControllers = [0, 1, 2];
    for (const i of newControllers) {
      await instance.addController(accounts[0], accounts[i + 2], {
        from: accounts[1],
      });
    }

    await instance.enableKeyRotation(accounts[0], 5, { from: accounts[1] });

    const firstController = await instance.identityController.call(accounts[0]);
    for (const i of new Array(10)) {
      const currentController = await instance.identityController.call(
        accounts[0],
      );
      if (firstController !== currentController) {
        return assert.equal(true, true, "DIDRegistry didn't change controller");
      }
      await sleep(1);
    }
    return assert.equal(true, false, "DIDRegistry didn't change controller");
  });

  it('should not do automatic key rotation', async () => {
    const instance = await DIDRegistry.deployed();

    await instance.disableKeyRotation(accounts[0], {
      from: await instance.identityController.call(accounts[0]),
    });
    await instance.changeController(accounts[0], accounts[4], {
      from: await instance.identityController.call(accounts[0]),
    });

    await sleep(10);

    const currentController = await instance.identityController.call(
      accounts[0],
    );

    return assert.equal(
      currentController,
      accounts[4],
      "DIDRegistry didn't change controller",
    );
  });
});
