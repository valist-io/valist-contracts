// SPDX-License-Identifier: MPL-2.0
pragma solidity >=0.8.4;
pragma experimental ABIEncoderV2;

import "@opengsn/contracts/src/forwarder/IForwarder.sol";
import "@opengsn/contracts/src/BasePaymaster.sol";

contract Paymaster is BasePaymaster {
	/// @dev allowed contract addresses
	mapping(address => bool) public allowed;

	function preRelayedCall(
		GsnTypes.RelayRequest calldata relayRequest,
		bytes calldata signature,
		bytes calldata approvalData,
		uint256 maxPossibleGas
	)
		external 
		override 
		virtual
		returns (bytes memory context, bool) 
	{
		_verifyForwarder(relayRequest);
		(signature, approvalData, maxPossibleGas);
		
		require(allowed[relayRequest.request.to]);
    return (abi.encode(block.timestamp), false);
	}

	function postRelayedCall(
		bytes calldata context,
		bool success,
		uint256 gasUseWithoutPost,
		GsnTypes.RelayData calldata relayData
	) 
		external 
		override 
		virtual 
	{
    (context, success, gasUseWithoutPost, relayData);
	}

	function allowAddress(address _target) external onlyOwner {
		allowed[_target] = true;
	}

	function revokeAddress(address _target) external onlyOwner {
		allowed[_target] = false;
	}

  function versionPaymaster() external virtual view override returns (string memory) {
    return "2.2.3";
  }
}
