// SPDX-License-Identifier: MPL-2.0
pragma solidity >=0.8.4;

import "../core/Registry.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title Valist License contract
contract License is ERC1155 {
  /// @dev emitted when sales are allowed.
  event SaleAllowed(
    uint _projectID,
    address _token,
    address _sender
  );

  /// @dev emitted when sales are revoked.
  event SaleRevoked(
    uint _projectID,
    address _token,
    address _sender
  );

  /// @dev emitted when mint price is changed.
  event PriceChanged(
    uint _projectID,
    address _token,
    uint _price,
    address _sender
  );

  struct Product {
    uint price;
    bool allow;
    mapping(IERC20 => uint) priceERC20;
    mapping(IERC20 => bool) allowERC20;
  }

  /// @dev mapping of project or release ID to product
  mapping(uint => Product) private productByID;

  /// @dev token symbol
  string public symbol = "LICENSE";
  /// @dev token display name
  string public name = "Valist Software License";
  /// @dev address of treasury to send funds to
  address payable public treasury;
  /// @dev address of contract owner
  address public owner;
  /// @dev mint fee percentage
  uint public mintFee;
  /// @dev address of the valist registry
  Registry public registry;

  /// Creates a Valist License contract.
  ///
  /// @param _registry Address of the Valist Registry.
  /// @param _treasury Address of the treasury for receiving funds.
  constructor(address _registry, address payable _treasury) ERC1155("") {
    owner = msg.sender;
    treasury = _treasury;
    registry = Registry(_registry);
  }

  /// Allow sales of a product in native tokens.
  ///
  /// @param _projectID ID of the project.
  function allowSale(uint _projectID) public {
    uint accountID = registry.getProjectAccountID(_projectID);
    require(registry.isAccountMember(accountID, _msgSender()), "err-not-member");

    productByID[_projectID].allow = true;
    emit SaleAllowed(_projectID, address(0), _msgSender());
  }

  /// Allow sales of a product in ERC20 tokens.
  ///
  /// @param _projectID ID of the project.
  function allowSale(IERC20 _token, uint _projectID) public {
    uint accountID = registry.getProjectAccountID(_projectID);
    require(registry.isAccountMember(accountID, _msgSender()), "err-not-member");

    productByID[_projectID].allowERC20[_token] = true;
    emit SaleAllowed(_projectID, address(_token), _msgSender());
  }

  /// Revoke sales of a product in native tokens.
  ///
  /// @param _projectID ID of the project.
  function revokeSale(uint _projectID) public {
    uint accountID = registry.getProjectAccountID(_projectID);
    require(registry.isAccountMember(accountID, _msgSender()), "err-not-member");

    productByID[_projectID].allow = false;
    emit SaleRevoked(_projectID, address(0), _msgSender());
  }

  /// Revoke sales of a product in ERC20 tokens.
  ///
  /// @param _token ERC20 token address.
  /// @param _projectID ID of the project.
  function revokeSale(IERC20 _token, uint _projectID) public {
    uint accountID = registry.getProjectAccountID(_projectID);
    require(registry.isAccountMember(accountID, _msgSender()), "err-not-member");

    productByID[_projectID].allowERC20[_token] = false;
    emit SaleRevoked(_projectID, address(_token), _msgSender());
  }

  /// Set the mint price of a product in native tokens.
  ///
  /// @param _projectID ID of the project.
  /// @param _price Mint price in wei.
  function setPrice(uint _projectID, uint _price) public {
    uint accountID = registry.getProjectAccountID(_projectID);
    require(registry.isAccountMember(accountID, _msgSender()), "err-not-member");

    productByID[_projectID].price = _price;
    emit PriceChanged(_projectID, address(0), _price, _msgSender());
  }

  /// Set the mint price of a product in ERC20 tokens.
  ///
  /// @param _token ERC20 token address.
  /// @param _projectID ID of the project.
  /// @param _price Mint price in ERC20 tokens.
  function setPrice(IERC20 _token, uint _projectID, uint _price) public {
    uint accountID = registry.getProjectAccountID(_projectID);
    require(registry.isAccountMember(accountID, _msgSender()), "err-not-member");

    productByID[_projectID].priceERC20[_token] = _price;
    emit PriceChanged(_projectID, address(_token), _price, _msgSender());
  }

  /// Returns true if sales for the product are allowed in native tokens.
  ///
  /// @param _projectID ID of the project.
  function isAllowed(uint _projectID) public view returns(bool) {
    return productByID[_projectID].allow;
  }

  /// Returns true if sales for the product are allowed in ERC20 tokens.
  ///
  /// @param _token ERC20 token address.
  /// @param _projectID ID of the project.
  function isAllowed(IERC20 _token, uint _projectID) public view returns(bool) {
    return productByID[_projectID].allowERC20[_token];
  }

  /// Returns the mint price of the product in wei.
  ///
  /// @param _projectID ID of the project.
  function getPrice(uint _projectID) public view returns(uint) {
    return productByID[_projectID].price;
  }

  /// Returns the mint price of the product in ERC20 tokens.
  ///
  /// @param _token ERC20 token address.
  /// @param _projectID ID of the project.
  function getPrice(IERC20 _token, uint _projectID) public view returns(uint) {
    return productByID[_projectID].priceERC20[_token];
  }

  /// Mints a product using native tokens.
  ///
  /// @param _projectID ID of the project.
  /// @param _recipient Address of the recipient.
  function mint(uint _projectID, address _recipient) public payable {
    require(productByID[_projectID].allow, "err-not-allowed");
    require(msg.value >= productByID[_projectID].price, "err-value");

    uint accountID = registry.getProjectAccountID(_projectID);
    address payable beneficiary = registry.getBeneficiary(accountID);

    uint splitFee = msg.value * mintFee;
    Address.sendValue(treasury, splitFee);
    Address.sendValue(beneficiary, msg.value - splitFee);

    _mint(_recipient, _projectID, 1, "");
  }

  /// Mints a product using ERC20 tokens.
  ///
  /// @param _token ERC20 token address.
  /// @param _projectID ID of the project.
  /// @param _recipient Address of the recipient.
  function mint(IERC20 _token, uint _projectID, address _recipient) public {
    uint price = productByID[_projectID].priceERC20[_token];

    require(productByID[_projectID].allowERC20[_token], "err-not-allowed");
    require(_token.balanceOf(_msgSender()) >= price, "err-value");

    uint accountID = registry.getProjectAccountID(_projectID);
    address beneficiary = registry.getBeneficiary(accountID);

    uint splitFee = price * mintFee;
    SafeERC20.safeTransfer(_token, treasury, splitFee);
    SafeERC20.safeTransfer(_token, beneficiary, price - splitFee);

    _mint(_recipient, _projectID, 1, "");
  }

  /// Sets the treasury address. Owner only.
  ///
  /// @param _treasury Address of the treasury for receiving funds.
  function setTreasury(address payable _treasury) public onlyOwner {
    treasury = _treasury;
  }

  /// Sets the valist registry address. Owner only.
  ///
  /// @param _registry Address of the Valist Registry.
  function setRegistry(address _registry) public onlyOwner {
    registry = Registry(_registry);
  }

  /// Sets the owner address. Owner only.
  ///
  /// @param _owner Address of the new owner.
  function setOwner(address _owner) public onlyOwner {
    owner = _owner;
  }

  /// Modifier that ensures only the owner can call a function.
  modifier onlyOwner() {
    require(owner == _msgSender(), "caller is not the owner");
    _;
  }
}