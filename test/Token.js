const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether');
};

describe('Token contract', () => {
  let token, deployer, receiver;

  beforeEach(async () => {
    // Fetch token from Blockchain
    const Token = await ethers.getContractFactory('Token');
    token = await Token.deploy('DavDotSol', 'DAVS', '1000000');
    let accounts = await ethers.getSigners();
    deployer = accounts[0];
    receiver = accounts[1];
  });

  describe('Deployment', () => {
    const name = 'DavDotSol';
    const symbol = 'DAVS';
    const decimals = 18;
    const totalSupply = tokens(1000000);

    it('has correct name', async () => {
      expect(await token.name()).to.equal(name);
    });

    it('has correct symbol', async () => {
      expect(await token.symbol()).to.equal(symbol);
    });

    it('has correct decimals', async () => {
      expect(await token.decimals()).to.equal(decimals);
    });

    it('has correct total supply', async () => {
      expect(await token.totalSupply()).to.equal(totalSupply);
    });

    it('assigns total supply to deployer', async () => {
      expect(await token.balanceOf(deployer.address)).to.equal(totalSupply);
    });
  });

  describe('Sending Tokens', () => {
    let amount, result;

    describe('Success', () => {
      beforeEach(async () => {
        amount = tokens(100);
        let transaction = await token
          .connect(deployer)
          .transfer(receiver.address, amount);
        result = await transaction.wait();
      });

      it('transfers token balances', async () => {
        expect(await token.balanceOf(deployer.address)).to.equal(
          tokens(999900)
        );
        expect(await token.balanceOf(receiver.address)).to.equal(amount);
      });

      it('emits a Transfer event', async () => {
        const event = result.events[0];
        expect(event.event).to.equal('Transfer');
        const args = event.args;
        expect(args._from).to.equal(deployer.address);
        expect(args._to).to.equal(receiver.address);
        expect(args._value).to.equal(amount);
      });
    });

    describe('Failure', () => {
      it('rejects insufficient balances', async () => {
        const invalidAmount = tokens(100000000);
        await expect(
          token.connect(deployer).transfer(receiver.address, invalidAmount)
        ).to.be.reverted;
      });

      it('rejects invalid recipient', async () => {
        await expect(
          token
            .connect(deployer)
            .transfer('0x0000000000000000000000000000000000000000', amount)
        ).to.be.reverted;
      });
    });
  });
});
