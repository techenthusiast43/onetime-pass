// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title OneTimePass
 * @notice Decentralized Single-Use Digital Pass Management for BOT Chain.
 * Tracks digital passes that can only be redeemed once.
 */
contract OneTimePass {
    enum PassStatus {
        None,       // 0: Pass does not exist
        Active,     // 1: Pass is active and redeemable
        Redeemed,   // 2: Pass has already been redeemed
        Revoked,    // 3: Pass was canceled by creator
        Expired     // 4: Pass has exceeded its expiry timestamp
    }

    // Storage packed into a single 32-byte slot + title string
    // creator (20 bytes) + rawStatus (1 byte) + expiry (8 bytes) = 29 bytes <= 32 bytes
    struct PassData {
        address creator;
        uint8 rawStatus; // 0 = None, 1 = Active, 2 = Redeemed, 3 = Revoked
        uint64 expiry;   // Unix timestamp in seconds; 0 = no expiry
        string title;
    }

    // Mapping from passId to pass data
    mapping(bytes32 => PassData) private _passes;

    // Creator to array of created pass IDs for fast on-chain indexing
    mapping(address => bytes32[]) private _creatorPasses;

    // Events
    event PassCreated(
        bytes32 indexed passId,
        address indexed creator,
        string title,
        uint256 expiry,
        uint256 timestamp
    );

    event PassRedeemed(
        bytes32 indexed passId,
        address indexed redeemer,
        uint256 timestamp
    );

    event PassRevoked(
        bytes32 indexed passId,
        address indexed creator,
        uint256 timestamp
    );

    // Custom errors for minimal gas consumption and clear reverts
    error InvalidPassId();
    error PassAlreadyExists();
    error PassNotFound();
    error NotCreator();
    error PassAlreadyRedeemed();
    error PassAlreadyRevoked();
    error PassHasExpired();
    error PassNotActive();

    /**
     * @notice Creates a new one-time pass.
     * @param passId Unique 32-byte identifier generated cryptographically.
     * @param title Optional short title or description for the pass.
     * @param expiry Optional unix timestamp after which pass cannot be redeemed. (0 for no expiry)
     */
    function createPass(
        bytes32 passId,
        string calldata title,
        uint256 expiry
    ) external {
        if (passId == bytes32(0)) revert InvalidPassId();
        if (_passes[passId].rawStatus != 0) revert PassAlreadyExists();
        if (expiry > 0 && expiry <= block.timestamp) revert PassHasExpired();

        _passes[passId] = PassData({
            creator: msg.sender,
            rawStatus: 1, // Active
            expiry: uint64(expiry),
            title: title
        });

        _creatorPasses[msg.sender].push(passId);

        emit PassCreated(passId, msg.sender, title, expiry, block.timestamp);
    }

    /**
     * @notice Redeems an active pass.
     * @dev For version 1, only the pass creator can redeem the pass.
     * @param passId The unique pass identifier.
     */
    function redeemPass(bytes32 passId) external {
        if (passId == bytes32(0)) revert InvalidPassId();
        PassData storage pass = _passes[passId];
        if (pass.rawStatus == 0) revert PassNotFound();
        if (pass.creator != msg.sender) revert NotCreator();
        if (pass.rawStatus == 2) revert PassAlreadyRedeemed();
        if (pass.rawStatus == 3) revert PassAlreadyRevoked();
        if (pass.expiry > 0 && block.timestamp > pass.expiry) revert PassHasExpired();
        if (pass.rawStatus != 1) revert PassNotActive();

        pass.rawStatus = 2; // Redeemed

        emit PassRedeemed(passId, msg.sender, block.timestamp);
    }

    /**
     * @notice Revokes an active pass. Only the creator can revoke their pass.
     * @param passId The unique pass identifier.
     */
    function revokePass(bytes32 passId) external {
        if (passId == bytes32(0)) revert InvalidPassId();
        PassData storage pass = _passes[passId];
        if (pass.rawStatus == 0) revert PassNotFound();
        if (pass.creator != msg.sender) revert NotCreator();
        if (pass.rawStatus == 2) revert PassAlreadyRedeemed();
        if (pass.rawStatus == 3) revert PassAlreadyRevoked();
        if (pass.rawStatus != 1) revert PassNotActive();

        pass.rawStatus = 3; // Revoked

        emit PassRevoked(passId, msg.sender, block.timestamp);
    }

    /**
     * @notice Checks the current dynamic status of a pass.
     * @param passId The unique pass identifier.
     * @return PassStatus Current status of the pass (None, Active, Redeemed, Revoked, Expired).
     */
    function checkPass(bytes32 passId) public view returns (PassStatus) {
        PassData storage pass = _passes[passId];
        if (pass.rawStatus == 0) {
            return PassStatus.None;
        }
        if (pass.rawStatus == 2) {
            return PassStatus.Redeemed;
        }
        if (pass.rawStatus == 3) {
            return PassStatus.Revoked;
        }
        if (pass.expiry > 0 && block.timestamp > pass.expiry) {
            return PassStatus.Expired;
        }
        return PassStatus.Active;
    }

    /**
     * @notice Retrieves the full details of a pass.
     * @param passId The unique pass identifier.
     * @return creator Address of the pass creator.
     * @return title Short description or title.
     * @return expiry Unix timestamp when the pass expires (0 if no expiry).
     * @return status The effective dynamic PassStatus.
     */
    function getPass(bytes32 passId) external view returns (
        address creator,
        string memory title,
        uint256 expiry,
        PassStatus status
    ) {
        PassData storage pass = _passes[passId];
        if (pass.rawStatus == 0) revert PassNotFound();

        return (
            pass.creator,
            pass.title,
            uint256(pass.expiry),
            checkPass(passId)
        );
    }

    /**
     * @notice Gets all pass IDs created by an address.
     * @param creator Address of the creator.
     * @return Array of bytes32 pass IDs.
     */
    function getCreatorPasses(address creator) external view returns (bytes32[] memory) {
        return _creatorPasses[creator];
    }
}

