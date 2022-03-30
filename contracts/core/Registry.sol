// SPDX-License-Identifier: MPL-2.0
pragma solidity >=0.8.4;

import "@opengsn/contracts/src/BaseRelayRecipient.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/// @title Valist registry contract
///
/// @custom:err-empty-meta metadata URI is required
/// @custom:err-empty-members atleast one member is required
/// @custom:err-empty-name name is required
/// @custom:err-name-claimed name has already been claimed
/// @custom:err-not-member sender is not a member
/// @custom:err-member-exist member already exists
/// @custom:err-member-not-exist member does not exist
/// @custom:err-not-exist account, project, or release does not exist
contract Registry is BaseRelayRecipient {
  using EnumerableSet for EnumerableSet.AddressSet;

  /// @dev emitted when an account is created
  event AccountCreated(
    uint _accountID,
    string _name,
    string _metaURI,
    address _beneficiary,
    address _sender
  );

  /// @dev emitted when an account is updated
  event AccountUpdated(
    uint _accountID,
    string _metaURI,
    address _sender
  );

  /// @dev emitted when an account member is added
  event AccountMemberAdded(
    uint _accountID,
    address _member,
    address _sender
  );
  
  /// @dev emitted when an account member is removed
  event AccountMemberRemoved(
    uint _accountID,
    address _member,
    address _sender
  );

  /// @dev emitted when an account beneficiary is updated..
  event BeneficiaryUpdated(
    uint _accountID,
    address _beneficiary,
    address _sender
  );

  /// @dev emitted when a new project is created
  event ProjectCreated(
    uint _accountID,
    uint _projectID,
    string _name,
    string _metaURI, 
    address _sender
  );

  /// @dev emitted when an existing project is updated
  event ProjectUpdated(
    uint _projectID,
    string _metaURI,
    address _sender
  );

  /// @dev emitted when a new project member is added
  event ProjectMemberAdded(
    uint _projectID,
    address _member,
    address _sender
  );

  /// @dev emitted when an existing project member is removed
  event ProjectMemberRemoved(
    uint _projectID,
    address _member,
    address _sender
  );

  /// @dev emitted when a new release is created
  event ReleaseCreated(
    uint _projectID,
    uint _releaseID,
    string _name,
    string _metaURI, 
    address _sender
  );

  /// @dev emitted when a release is approved by a signer
  event ReleaseApproved(
    uint _releaseID,
    address _sender
  );

  /// @dev emitted when a release approval is revoked by a signer.
  event ReleaseRevoked(
    uint _releaseID,
    address _sender
  );

  struct Account {
    address payable beneficiary;
    EnumerableSet.AddressSet members;
  }

  struct Project {
    uint accountID;
    EnumerableSet.AddressSet members;
  }

  struct Release {
    uint projectID;
    EnumerableSet.AddressSet signers;
  }

  /// @dev mapping of account ID to account
  mapping(uint => Account) private accountByID;
  /// @dev mapping of project ID to project
  mapping(uint => Project) private projectByID;
  /// @dev mapping of release ID to release
  mapping(uint => Release) private releaseByID;
  /// @dev mapping of account, project, and release ID to meta URI
  mapping(uint => string) public metaByID;

  /// @dev version of BaseRelayRecipient this contract implements
  string public override versionRecipient = "2.2.3";
  /// @dev address of contract owner
  address public owner;
  /// @dev address of treasury to send funds to
  address payable public treasury;
  /// @dev account name claim fee
  uint public claimFee;

  /// Creates a Valist Registry contract.
  ///
  /// @param _forwarder Address of meta transaction forwarder.
  /// @param _treasury Address of the treasury for receiving funds.
  constructor(address _forwarder, address payable _treasury) {
    owner = msg.sender;
    treasury = _treasury;
    _setTrustedForwarder(_forwarder);
  }

  /// Creates an account with the given members and beneficiary.
  ///
  /// @param _name Unique name used to identify the account.
  /// @param _metaURI URI of the account metadata.
  /// @param _beneficiary Beneficiary address for recieving payments.
  /// @param _members List of members to add to the account.
  function createAccount(
    string memory _name,
    string memory _metaURI,
    address payable _beneficiary,
    address[] memory _members
  )
    public
    payable
  {
    require(msg.value >= claimFee, "err-value");
    require(bytes(_metaURI).length > 0, "err-empty-meta");
    require(bytes(_name).length > 0, "err-empty-name");
    require(_members.length > 0, "err-empty-members");

    Address.sendValue(treasury, msg.value);

    uint accountID = generateID(block.chainid, _name);
    require(bytes(metaByID[accountID]).length == 0, "err-name-claimed");

    metaByID[accountID] = _metaURI;
    accountByID[accountID].beneficiary = _beneficiary;
    emit AccountCreated(accountID, _name, _metaURI, _beneficiary, _msgSender());

    for (uint i = 0; i < _members.length; ++i) {
      accountByID[accountID].members.add(_members[i]);
      emit AccountMemberAdded(accountID, _members[i], _msgSender());
    }
  }
  
  /// Creates a new project. Requires the sender to be a member of the account.
  ///
  /// @param _accountID ID of the account to create the project under.
  /// @param _name Unique name used to identify the project.
  /// @param _metaURI URI of the project metadata.
  /// @param _members Optional list of members to add to the project.
  function createProject(
    uint _accountID,
    string memory _name,
    string memory _metaURI,
    address[] memory _members
  )
    public
  {
    require(bytes(_metaURI).length > 0, "err-empty-meta");
    require(bytes(_name).length > 0, "err-empty-name");

    uint projectID = generateID(_accountID, _name);
    require(isAccountMember(_accountID, _msgSender()), "err-not-member");
    require(bytes(metaByID[projectID]).length == 0, "err-name-claimed");

    metaByID[projectID] = _metaURI;
    projectByID[projectID].accountID = _accountID;
    emit ProjectCreated(_accountID, projectID, _name, _metaURI, _msgSender());

    for (uint i = 0; i < _members.length; ++i) {
      projectByID[projectID].members.add(_members[i]);
      emit ProjectMemberAdded(projectID, _members[i], _msgSender());
    }
  }

  /// Creates a new release. Requires the sender to be a member of the project.
  ///
  /// @param _projectID ID of the project create the release under.
  /// @param _name Unique name used to identify the release.
  /// @param _metaURI URI of the project metadata.
  function createRelease(
    uint _projectID,
    string memory _name,
    string memory _metaURI
  )
    public
  {
    require(bytes(_name).length > 0, "err-empty-name");
    require(bytes(_metaURI).length > 0, "err-empty-meta");
    require(bytes(metaByID[_projectID]).length > 0, "err-not-exist");

    uint releaseID = generateID(_projectID, _name);
    require(bytes(metaByID[releaseID]).length == 0, "err-name-claimed");

    uint accountID = getProjectAccountID(_projectID);
    require(
      isProjectMember(_projectID, _msgSender()) ||
      isAccountMember(accountID, _msgSender()),
      "err-not-member"
    );

    metaByID[releaseID] = _metaURI;
    releaseByID[releaseID].projectID = _projectID;
    emit ReleaseCreated(_projectID, releaseID, _name, _metaURI, _msgSender());
  }

  /// Approve the release by adding the sender's address to the approvers list.
  ///
  /// @param _releaseID ID of the release.
  function approveRelease(uint _releaseID) public {
    require(bytes(metaByID[_releaseID]).length > 0, "err-not-exist");
    require(!releaseByID[_releaseID].signers.contains(_msgSender()), "err-member-exist");

    releaseByID[_releaseID].signers.add(_msgSender());
    emit ReleaseApproved(_releaseID, _msgSender());
  }

  /// Revoke a release signature by removing the sender's address from the approvers list.
  ///
  /// @param _releaseID ID of the release.
  function revokeRelease(uint _releaseID) public {
    require(bytes(metaByID[_releaseID]).length > 0, "err-not-exist");
    require(releaseByID[_releaseID].signers.contains(_msgSender()), "err-member-exist");

    releaseByID[_releaseID].signers.remove(_msgSender());
    emit ReleaseRevoked(_releaseID, _msgSender());
  }

  /// Add a member to the account. Requires the sender to be a member of the account.
  ///
  /// @param _accountID ID of the account.
  /// @param _address Address of member.
  function addAccountMember(uint _accountID, address _address) public {
    require(isAccountMember(_accountID, _msgSender()), "err-not-member");
    require(!isAccountMember(_accountID, _address), "err-member-exist");

    accountByID[_accountID].members.add(_address);
    emit AccountMemberAdded(_accountID, _address, _msgSender());
  }

  /// Remove a member from the account. Requires the sender to be a member of the account.
  ///
  /// @param _accountID ID of the account.
  /// @param _address Address of member.
  function removeAccountMember(uint _accountID, address _address) public {
    require(isAccountMember(_accountID, _msgSender()), "err-not-member");
    require(isAccountMember(_accountID, _address), "err-member-not-exist");

    accountByID[_accountID].members.remove(_address);
    emit AccountMemberRemoved(_accountID, _address, _msgSender());
  }

  /// Add a member to the project. Requires the sender to be a member of the parent account.
  ///
  /// @param _projectID ID of the project.
  /// @param _address Address of member.
  function addProjectMember(uint _projectID, address _address) public {
    require(bytes(metaByID[_projectID]).length > 0, "err-not-exist");
    require(!isProjectMember(_projectID, _address), "err-member-exist");

    uint accountID = getProjectAccountID(_projectID);
    require(isAccountMember(accountID, _msgSender()), "err-not-member");

    projectByID[_projectID].members.add(_address);
    emit ProjectMemberAdded(_projectID, _address, _msgSender());
  }

  /// Remove a member from the project. Requires the sender to be a member of the parent account.
  ///
  /// @param _projectID ID of the project.
  /// @param _address Address of member.
  function removeProjectMember(uint _projectID, address _address) public {
    require(bytes(metaByID[_projectID]).length > 0, "err-not-exist");
    require(isProjectMember(_projectID, _address), "err-member-not-exist"); 

    uint accountID = getProjectAccountID(_projectID);
    require(isAccountMember(accountID, _msgSender()), "err-not-member");

    projectByID[_projectID].members.remove(_address);
    emit ProjectMemberRemoved(_projectID, _address, _msgSender());   
  }

  /// Set account beneficiary address for recieving payments.
  ///
  /// @param _accountID Unique ID of the account.
  /// @param _beneficiary Address of beneficiary.
  function setBeneficiary(uint _accountID, address payable _beneficiary) public {
    require(isAccountMember(_accountID, _msgSender()), "err-not-member");
    
    accountByID[_accountID].beneficiary = _beneficiary;
    emit BeneficiaryUpdated(_accountID, _beneficiary, _msgSender());
  }

  /// Sets the account metadata URI. Requires the sender to be a member of the account.
  ///
  /// @param _accountID ID of the account.
  /// @param _metaURI Metadata URI.
  function setAccountMetaURI(uint _accountID, string memory _metaURI) public {
    require(bytes(_metaURI).length > 0, "err-empty-meta");
    require(isAccountMember(_accountID, _msgSender()), "err-not-member");
    require(bytes(metaByID[_accountID]).length > 0, "err-not-exist");

    metaByID[_accountID] = _metaURI;
    emit AccountUpdated(_accountID, _metaURI, _msgSender());
  }

  /// Sets the project metadata URI. Requires the sender to be a member of the parent account.
  ///
  /// @param _projectID ID of the project.
  /// @param _metaURI Metadata URI.
  function setProjectMetaURI(uint _projectID, string memory _metaURI) public {
    require(bytes(_metaURI).length > 0, "err-empty-meta");
    require(bytes(metaByID[_projectID]).length > 0, "err-not-exist");

    uint accountID = getProjectAccountID(_projectID);
    require(isAccountMember(accountID, _msgSender()), "err-not-member");

    metaByID[_projectID] = _metaURI;
    emit ProjectUpdated(_projectID, _metaURI, _msgSender());
  }

  /// Generates account, project, or release ID.
  ///
  /// @param _parentID ID of the parent account or project. Use `block.chainid` for accounts.
  /// @param _name Name of the account, project, or release.
  function generateID(uint _parentID, string memory _name) public pure returns (uint) {
    return uint(keccak256(abi.encodePacked(_parentID, keccak256(bytes(_name)))));
  }

  /// Returns true if the address is a member of the team.
  ///
  /// @param _accountID ID of the account.
  /// @param _member Address of member.
  function isAccountMember(uint _accountID, address _member) public view returns (bool) {
    return accountByID[_accountID].members.contains(_member);
  }

  /// Returns true if the address is a member of the project.
  ///
  /// @param _projectID ID of the project.
  /// @param _member Address of member.
  function isProjectMember(uint _projectID, address _member) public view returns (bool) {
    return projectByID[_projectID].members.contains(_member);
  }

  /// Returns true if the address is a signer of the release.
  ///
  /// @param _releaseID ID of the release.
  /// @param _signer Address of the signer.
  function isReleaseSigner(uint _releaseID, address _signer) public view returns (bool) {
    return releaseByID[_releaseID].signers.contains(_signer);
  }

  /// Returns a list of account members.
  ///
  /// @param _accountID ID of the account.
  function getAccountMembers(uint _accountID) public view returns (address[] memory) {
    return accountByID[_accountID].members.values();
  }

  /// Returns a list of project members.
  ///
  /// @param _projectID ID of the project.
  function getProjectMembers(uint _projectID) public view returns (address[] memory) {
    return projectByID[_projectID].members.values();
  }

  /// Returns a list of release signers.
  ///
  /// @param _releaseID ID of the release.
  function getReleaseSigners(uint _releaseID) public view returns (address[] memory) {
    return releaseByID[_releaseID].signers.values();
  }

  /// Returns account beneficiary address.
  ///
  /// @param _accountID Unique ID of the account.
  function getBeneficiary(uint _accountID) public view returns (address payable) {
    return accountByID[_accountID].beneficiary;
  }

  /// Returns the parent account ID for the project.
  ///
  /// @param _projectID ID of the project.
  function getProjectAccountID(uint _projectID) public view returns (uint) {
    return projectByID[_projectID].accountID;
  }

  /// Returns the parent project ID for the release.
  /// 
  /// @param _releaseID ID of the release.
  function getReleaseProjectID(uint _releaseID) public view returns (uint) {
    return releaseByID[_releaseID].projectID;
  }

  /// Sets the owner address. Owner only.
  ///
  /// @param _owner Address of the new owner.
  function setOwner(address _owner) public onlyOwner {
    owner = _owner;
  }

  /// Sets the account claim fee. Owner only.
  ///
  /// @param _claimFee Claim fee amount in wei.
  function setClaimFee(uint _claimFee) public onlyOwner {
    claimFee = _claimFee;
  }

  /// Sets the treasury address. Owner only.
  ///
  /// @param _treasury Address of the treasury for receiving funds.
  function setTreasury(address payable _treasury) public onlyOwner {
    treasury = _treasury;
  }

  /// Sets the trusted forward address. Owner only.
  ///
  /// @param _forwarder Address of meta transaction forwarder.
  function setTrustedForwarder(address _forwarder) public onlyOwner {
    _setTrustedForwarder(_forwarder);
  }

  /// Modifier that ensures only the owner can call a function.
  modifier onlyOwner() {
    require(owner == _msgSender(), "caller is not the owner");
    _;
  }
}
