// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ZeroTrustContent {
    struct Content {
        string ipfsHash;
        address author;
        uint256 timestamp;
    }

    mapping(uint256 => Content) public contents;
    mapping(address => uint8) public offenseCount;
    mapping(address => bool) public isBanned;
    mapping(address => uint256) public lastVerification;
    uint256 public contentCount;

    uint256 constant MIN_BALANCE = 0.0001 ether;
    uint256 constant VERIFICATION_DURATION = 30 days;
    uint8 constant MAX_OFFENSES = 5;

    event ContentPosted(uint256 indexed contentId, address indexed author, string ipfsHash, uint256 timestamp);
    event UserBanned(address indexed user);
    event UserVerified(address indexed user, uint256 timestamp);

    modifier notBanned() {
        require(!isBanned[msg.sender], "You are banned from posting.");
        _;
    }

    function postContent(string memory ipfsHash) external notBanned {
        contents[contentCount] = Content(ipfsHash, msg.sender, block.timestamp);
        emit ContentPosted(contentCount, msg.sender, ipfsHash, block.timestamp);
        contentCount++;
    }

    function verifyUser() external {
        require(address(msg.sender).balance >= MIN_BALANCE, "Insufficient balance for verification.");
        lastVerification[msg.sender] = block.timestamp;
        emit UserVerified(msg.sender, block.timestamp);
    }

    function reportOffense(address user) external {
        offenseCount[user]++;
        if (offenseCount[user] >= MAX_OFFENSES) {
            isBanned[user] = true;
            emit UserBanned(user);
        }
    }

    function isUserVerified(address user) external view returns (bool) {
        return block.timestamp <= lastVerification[user] + VERIFICATION_DURATION;
    }
}
