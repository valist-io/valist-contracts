pragma solidity ^0.8.5;

interface IVerificationRegistry {

    // Enum for verification status
    enum VerificationStatus { None, ValistVerified, CommunityVerified, Both }

    // Events
    event ValistVerified(bytes32 indexed appId);
    event CommunityVerified(bytes32 indexed appId);

    // Functions
    function valistVerify(bytes32 _appId) external;
    function communityVerify(bytes32 _appId) external;
    function verificationStatus(bytes32 _appId) external view returns (VerificationStatus);
}
