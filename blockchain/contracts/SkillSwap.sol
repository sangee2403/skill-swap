// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * SkillSwap — Decentralized Skill Exchange Protocol
 * 
 * Features:
 * 1. issueCredential  — Mint a skill credential NFT after session
 * 2. recordSession    — Store session proof on-chain
 * 3. getCredentials   — Fetch all credentials for a user
 * 4. getSessions      — Fetch all sessions for a user
 */
contract SkillSwap {

    // ── Structs ──────────────────────────────────────────────────────────────

    struct Credential {
        uint256 id;
        address recipient;      // wallet of person who earned it
        address issuedBy;       // wallet of person who taught
        string  skillName;      // e.g. "React", "Guitar"
        string  sessionId;      // links back to DB session
        uint256 issuedAt;       // block timestamp
        bool    valid;
    }

    struct Session {
        uint256 id;
        address user1;
        address user2;
        string  skill1;         // user1 taught this
        string  skill2;         // user2 taught this
        uint256 duration;       // seconds
        uint256 completedAt;
        string  sessionId;      // DB session ID
    }

    // ── State ────────────────────────────────────────────────────────────────

    address public owner;

    uint256 private _credentialIdCounter;
    uint256 private _sessionIdCounter;

    mapping(uint256 => Credential)   public credentials;
    mapping(address => uint256[])    public userCredentials;   // wallet → credential IDs

    mapping(uint256 => Session)      public sessions;
    mapping(address => uint256[])    public userSessions;      // wallet → session IDs

    // Prevent duplicate sessions
    mapping(string => bool) public sessionRecorded;

    // ── Events ────────────────────────────────────────────────────────────────

    event CredentialIssued(
        uint256 indexed credId,
        address indexed recipient,
        address indexed issuedBy,
        string  skillName,
        string  sessionId,
        uint256 issuedAt
    );

    event SessionRecorded(
        uint256 indexed sessionId,
        address indexed user1,
        address indexed user2,
        string  skill1,
        string  skill2,
        uint256 duration,
        uint256 completedAt
    );

    // ── Constructor ───────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    // ── Issue Credential ──────────────────────────────────────────────────────
    // Called after a skill exchange session completes
    // Both users can issue a credential to each other

    function issueCredential(
        address recipient,
        string memory skillName,
        string memory sessionId
    ) external returns (uint256) {
        require(recipient != address(0), "Invalid recipient");
        require(bytes(skillName).length > 0, "Skill name required");

        _credentialIdCounter++;
        uint256 credId = _credentialIdCounter;

        credentials[credId] = Credential({
            id:         credId,
            recipient:  recipient,
            issuedBy:   msg.sender,
            skillName:  skillName,
            sessionId:  sessionId,
            issuedAt:   block.timestamp,
            valid:      true
        });

        userCredentials[recipient].push(credId);

        emit CredentialIssued(credId, recipient, msg.sender, skillName, sessionId, block.timestamp);

        return credId;
    }

    // ── Record Session ────────────────────────────────────────────────────────
    // Store proof of completed session on-chain

    function recordSession(
        address user2,
        string memory skill1,
        string memory skill2,
        uint256 duration,
        string memory dbSessionId
    ) external returns (uint256) {
        require(!sessionRecorded[dbSessionId], "Session already recorded");
        require(user2 != address(0), "Invalid user2");

        sessionRecorded[dbSessionId] = true;

        _sessionIdCounter++;
        uint256 sid = _sessionIdCounter;

        sessions[sid] = Session({
            id:          sid,
            user1:       msg.sender,
            user2:       user2,
            skill1:      skill1,
            skill2:      skill2,
            duration:    duration,
            completedAt: block.timestamp,
            sessionId:   dbSessionId
        });

        userSessions[msg.sender].push(sid);
        userSessions[user2].push(sid);

        emit SessionRecorded(sid, msg.sender, user2, skill1, skill2, duration, block.timestamp);

        return sid;
    }

    // ── View Functions ────────────────────────────────────────────────────────

    function getCredentials(address user) external view returns (Credential[] memory) {
        uint256[] memory ids  = userCredentials[user];
        Credential[] memory result = new Credential[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = credentials[ids[i]];
        }
        return result;
    }

    function getSessions(address user) external view returns (Session[] memory) {
        uint256[] memory ids = userSessions[user];
        Session[] memory result = new Session[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = sessions[ids[i]];
        }
        return result;
    }

    function getCredentialCount(address user) external view returns (uint256) {
        return userCredentials[user].length;
    }

    function getTotalCredentials() external view returns (uint256) {
        return _credentialIdCounter;
    }

    function getTotalSessions() external view returns (uint256) {
        return _sessionIdCounter;
    }
}
