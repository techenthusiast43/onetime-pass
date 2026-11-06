import { expect } from "chai";
import hre from "hardhat";
import helpers from "@nomicfoundation/hardhat-network-helpers";

const { ethers } = hre;
const { time } = helpers;

describe("OneTimePass Smart Contract", function () {
  let oneTimePass;
  let owner;
  let creator;
  let verifier;
  let stranger;

  const PassStatus = {
    None: 0,
    Active: 1,
    Redeemed: 2,
    Revoked: 3,
    Expired: 4,
  };

  beforeEach(async function () {
    [owner, creator, verifier, stranger] = await ethers.getSigners();
    const OneTimePassFactory = await ethers.getContractFactory("OneTimePass");
    oneTimePass = await OneTimePassFactory.deploy();
    await oneTimePass.waitForDeployment();
  });

  describe("Pass Creation", function () {
    it("should allow a user to create a valid pass without expiry", async function () {
      const passId = ethers.keccak256(ethers.toUtf8Bytes("pass-secret-1"));
      const title = "VIP Event Ticket";

      const tx = await oneTimePass.connect(creator).createPass(passId, title, 0);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(oneTimePass, "PassCreated")
        .withArgs(passId, creator.address, title, 0n, BigInt(block.timestamp));

      const status = await oneTimePass.checkPass(passId);
      expect(status).to.equal(PassStatus.Active);

      const pass = await oneTimePass.getPass(passId);
      expect(pass.creator).to.equal(creator.address);
      expect(pass.title).to.equal(title);
      expect(pass.expiry).to.equal(0n);
      expect(pass.status).to.equal(PassStatus.Active);

      const creatorPasses = await oneTimePass.getCreatorPasses(creator.address);
      expect(creatorPasses).to.include(passId);
    });

    it("should allow a user to create a valid pass with future expiry", async function () {
      const passId = ethers.keccak256(ethers.toUtf8Bytes("pass-secret-2"));
      const latestTime = await time.latest();
      const expiry = latestTime + 3600; // 1 hour from now

      await oneTimePass.connect(creator).createPass(passId, "Expiring Pass", expiry);
      const pass = await oneTimePass.getPass(passId);
      expect(pass.expiry).to.equal(BigInt(expiry));
      expect(pass.status).to.equal(PassStatus.Active);
    });

    it("should revert if passId is bytes32(0)", async function () {
      await expect(
        oneTimePass.connect(creator).createPass(ethers.ZeroHash, "Zero ID", 0)
      ).to.be.revertedWithCustomError(oneTimePass, "InvalidPassId");
    });

    it("should revert if duplicate passId is used", async function () {
      const passId = ethers.keccak256(ethers.toUtf8Bytes("pass-secret-duplicate"));
      await oneTimePass.connect(creator).createPass(passId, "Original", 0);

      await expect(
        oneTimePass.connect(creator).createPass(passId, "Duplicate", 0)
      ).to.be.revertedWithCustomError(oneTimePass, "PassAlreadyExists");

      // Even another user cannot reuse the ID
      await expect(
        oneTimePass.connect(stranger).createPass(passId, "Duplicate by stranger", 0)
      ).to.be.revertedWithCustomError(oneTimePass, "PassAlreadyExists");
    });

    it("should revert if expiry timestamp is in the past", async function () {
      const passId = ethers.keccak256(ethers.toUtf8Bytes("pass-expired-init"));
      const latestTime = await time.latest();
      const pastExpiry = latestTime - 100;

      await expect(
        oneTimePass.connect(creator).createPass(passId, "Past Expiry", pastExpiry)
      ).to.be.revertedWithCustomError(oneTimePass, "PassHasExpired");
    });
  });

  describe("Pass Retrieval & Status Checks", function () {
    it("should return PassStatus.None for non-existent pass", async function () {
      const randomId = ethers.keccak256(ethers.toUtf8Bytes("non-existent"));
      const status = await oneTimePass.checkPass(randomId);
      expect(status).to.equal(PassStatus.None);

      await expect(oneTimePass.getPass(randomId)).to.be.revertedWithCustomError(
        oneTimePass,
        "PassNotFound"
      );
    });

    it("should dynamically detect expiration via checkPass and getPass", async function () {
      const passId = ethers.keccak256(ethers.toUtf8Bytes("timed-pass"));
      const latestTime = await time.latest();
      const expiry = latestTime + 100;

      await oneTimePass.connect(creator).createPass(passId, "Expiring", expiry);
      expect(await oneTimePass.checkPass(passId)).to.equal(PassStatus.Active);

      // Fast forward past expiration
      await time.increaseTo(expiry + 10);

      expect(await oneTimePass.checkPass(passId)).to.equal(PassStatus.Expired);
      const pass = await oneTimePass.getPass(passId);
      expect(pass.status).to.equal(PassStatus.Expired);
    });
  });

  describe("Pass Redemption", function () {
    it("should allow creator to redeem an active pass and prevent double redemption", async function () {
      const passId = ethers.keccak256(ethers.toUtf8Bytes("redeem-1"));
      await oneTimePass.connect(creator).createPass(passId, "One-off Voucher", 0);

      const tx = await oneTimePass.connect(creator).redeemPass(passId);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(oneTimePass, "PassRedeemed")
        .withArgs(passId, creator.address, BigInt(block.timestamp));

      expect(await oneTimePass.checkPass(passId)).to.equal(PassStatus.Redeemed);

      // Attempting to redeem a second time must fail
      await expect(
        oneTimePass.connect(creator).redeemPass(passId)
      ).to.be.revertedWithCustomError(oneTimePass, "PassAlreadyRedeemed");
    });

    it("should reject redemption by non-creator in v1", async function () {
      const passId = ethers.keccak256(ethers.toUtf8Bytes("redeem-auth-test"));
      await oneTimePass.connect(creator).createPass(passId, "Creator Only", 0);

      await expect(
        oneTimePass.connect(stranger).redeemPass(passId)
      ).to.be.revertedWithCustomError(oneTimePass, "NotCreator");
    });

    it("should reject redemption of an expired pass", async function () {
      const passId = ethers.keccak256(ethers.toUtf8Bytes("redeem-expired"));
      const latestTime = await time.latest();
      const expiry = latestTime + 50;

      await oneTimePass.connect(creator).createPass(passId, "Short Lived", expiry);

      // Move past expiry
      await time.increaseTo(expiry + 5);

      await expect(
        oneTimePass.connect(creator).redeemPass(passId)
      ).to.be.revertedWithCustomError(oneTimePass, "PassHasExpired");
    });

    it("should reject redemption of a revoked pass", async function () {
      const passId = ethers.keccak256(ethers.toUtf8Bytes("redeem-revoked"));
      await oneTimePass.connect(creator).createPass(passId, "Revoked Pass", 0);
      await oneTimePass.connect(creator).revokePass(passId);

      await expect(
        oneTimePass.connect(creator).redeemPass(passId)
      ).to.be.revertedWithCustomError(oneTimePass, "PassAlreadyRevoked");
    });

    it("should reject redemption of non-existent pass", async function () {
      const nonExistent = ethers.keccak256(ethers.toUtf8Bytes("fake"));
      await expect(
        oneTimePass.connect(creator).redeemPass(nonExistent)
      ).to.be.revertedWithCustomError(oneTimePass, "PassNotFound");
    });
  });

  describe("Pass Revocation", function () {
    it("should allow creator to revoke active pass", async function () {
      const passId = ethers.keccak256(ethers.toUtf8Bytes("revoke-1"));
      await oneTimePass.connect(creator).createPass(passId, "Revokable", 0);

      const tx = await oneTimePass.connect(creator).revokePass(passId);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(oneTimePass, "PassRevoked")
        .withArgs(passId, creator.address, BigInt(block.timestamp));

      expect(await oneTimePass.checkPass(passId)).to.equal(PassStatus.Revoked);
    });

    it("should reject revocation by non-creator", async function () {
      const passId = ethers.keccak256(ethers.toUtf8Bytes("revoke-stranger"));
      await oneTimePass.connect(creator).createPass(passId, "Creator Only", 0);

      await expect(
        oneTimePass.connect(stranger).revokePass(passId)
      ).to.be.revertedWithCustomError(oneTimePass, "NotCreator");
    });

    it("should reject revocation of an already redeemed pass", async function () {
      const passId = ethers.keccak256(ethers.toUtf8Bytes("revoke-redeemed"));
      await oneTimePass.connect(creator).createPass(passId, "Redeemed First", 0);
      await oneTimePass.connect(creator).redeemPass(passId);

      await expect(
        oneTimePass.connect(creator).revokePass(passId)
      ).to.be.revertedWithCustomError(oneTimePass, "PassAlreadyRedeemed");
    });

    it("should reject revocation of an already revoked pass", async function () {
      const passId = ethers.keccak256(ethers.toUtf8Bytes("revoke-twice"));
      await oneTimePass.connect(creator).createPass(passId, "Revoke Twice", 0);
      await oneTimePass.connect(creator).revokePass(passId);

      await expect(
        oneTimePass.connect(creator).revokePass(passId)
      ).to.be.revertedWithCustomError(oneTimePass, "PassAlreadyRevoked");
    });
  });
});
