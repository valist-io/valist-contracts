// SPDX-License-Identifier: MPL-2.0
pragma solidity >=0.8.4;

import "../core/Registry.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title Valist License contract
contract License is ERC1155 {
  using SafeERC20 for IERC20;

  /// @dev emitted when mint price is changed.
  event PriceChanged(
    uint _projectID,
    address _token,
    uint _price,
    address _sender
  );

  /// @dev emitted when balance is withdrawn.
  event BalanceWithdrawn(
    uint _projectID,
    address _token,
    uint _balance,
    address _recipient,
    address _sender
  );

  /// @dev emitted when a product is purchased.
  event ProductPurchased(
    uint _projectID,
    address _token,
    uint _price,
    address _recipient,
    address _sender
  );

  struct Product {
    uint price;
    uint balance;
    mapping(IERC20 => uint) priceERC20;
    mapping(IERC20 => uint) balanceERC20;
  }

  /// @dev mapping of project ID to product info
  mapping(uint => Product) private productByID;

  /// @dev token symbol
  string public symbol = "LICENSE";
  /// @dev token display name
  string public name = "Valist Software License";
  /// @dev address of contract owner
  address payable public owner;
  /// @dev royalty basis points
  uint public royaltyBP;
  /// @dev address of the valist registry
  Registry public registry;

  /// Creates a Valist License contract.
  ///
  /// @param _registry Address of the Valist Registry.
  constructor(address _registry) ERC1155("") {
    owner = payable(msg.sender);
    registry = Registry(_registry);
  }

  /// Purchase a product using native tokens.
  ///
  /// @param _projectID ID of the project.
  /// @param _recipient Address of the recipient.
  function purchase(uint _projectID, address _recipient) public payable {
    uint price = productByID[_projectID].price;

    require(price > 0, "err-not-allowed");
    require(msg.value == price, "err-value");

    uint royalty = price * royaltyBP / 10000;

    // increase product balance
    productByID[_projectID].balance += price - royalty;

    // send royalty to owner
    Address.sendValue(owner, royalty);

    _mint(_recipient, _projectID, 1, "");
    emit ProductPurchased(_projectID, address(0), price, _recipient, _msgSender());
  }

  /// Purchase a product using ERC20 tokens.
  ///
  /// @param _token ERC20 token address.
  /// @param _projectID ID of the project.
  /// @param _recipient Address of the recipient.
  function purchase(IERC20 _token, uint _projectID, address _recipient) public {
    uint price = productByID[_projectID].priceERC20[_token];
    uint allowance = _token.allowance(_msgSender(), address(this));

    require(price > 0, "err-not-allowed");
    require(allowance >= price, "err-value");

    uint royalty = price * royaltyBP / 10000;

    // increase product balance
    productByID[_projectID].balanceERC20[_token] += price - royalty;

    // transfer tokens
    _token.safeTransferFrom(_msgSender(), address(this), price);

    // send royalty to owner
    _token.safeIncreaseAllowance(address(this), royalty);
    _token.safeTransferFrom(address(this), owner, royalty);

    _mint(_recipient, _projectID, 1, "");
    emit ProductPurchased(_projectID, address(_token), price, _recipient, _msgSender());
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

  /// Withdraw product balance in native tokens.
  ///
  /// @param _projectID ID of the project.
  /// @param _recipient Address of the recipient.
  function withdraw(uint _projectID, address payable _recipient) public {
    uint balance = productByID[_projectID].balance;
    uint accountID = registry.getProjectAccountID(_projectID);

    require(registry.isAccountMember(accountID, _msgSender()), "err-not-member");
    require(balance > 0, "err-balance");

    productByID[_projectID].balance = 0;
    Address.sendValue(_recipient, balance);

    emit BalanceWithdrawn(_projectID, address(0), balance, _recipient, _msgSender());
  }

  /// Withdraw product balance in ERC20 tokens.
  ///
  /// @param _token ERC20 token address.
  /// @param _projectID ID of the project.
  /// @param _recipient Address of the recipient.
  function withdraw(IERC20 _token, uint _projectID, address payable _recipient) public {
    uint balance = productByID[_projectID].balanceERC20[_token];
    uint accountID = registry.getProjectAccountID(_projectID);    

    require(registry.isAccountMember(accountID, _msgSender()), "err-not-member");
    require(balance > 0, "err-balance");

    productByID[_projectID].balanceERC20[_token] = 0;
    _token.safeTransfer(_recipient, balance);

    emit BalanceWithdrawn(_projectID, address(_token), balance, _recipient, _msgSender());
  }

  /// Returns the URI of the token
  ///
  /// @param _projectID ID of the project.
  function uri(uint _projectID) public view virtual override returns (string memory) {
    return registry.metaByID(_projectID);
  }

  /// Returns the balance of the product in wei.
  ///
  /// @param _projectID ID of the project.
  function getBalance(uint _projectID) public view returns(uint) {
    return productByID[_projectID].balance;
  }

  /// Returns the balance of the product in ERC20 tokens.
  ///
  /// @param _token ERC20 token address.
  /// @param _projectID ID of the project.
  function getBalance(IERC20 _token, uint _projectID) public view returns(uint) {
    return productByID[_projectID].balanceERC20[_token];
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

  /// Sets the valist registry address. Owner only.
  ///
  /// @param _registry Address of the Valist Registry.
  function setRegistry(address _registry) public onlyOwner {
    registry = Registry(_registry);
  }

  /// Sets the owner address. Owner only.
  ///
  /// @param _owner Address of the new owner.
  function setOwner(address payable _owner) public onlyOwner {
    owner = _owner;
  }

  /// Sets the royalty basis points. Owner only.
  ///
  /// @param _royaltyBP Royalty basis points.
  function setRoyalty(uint _royaltyBP) public onlyOwner {
    require(_royaltyBP < 10000);
    royaltyBP = _royaltyBP;
  }

  /// Modifier that ensures only the owner can call a function.
  modifier onlyOwner() {
    require(owner == _msgSender(), "caller is not the owner");
    _;
  }
}