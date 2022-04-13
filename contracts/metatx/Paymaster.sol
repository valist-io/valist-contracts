// SPDX-License-Identifier: MPL-2.0
pragma solidity >=0.8.4;
pragma experimental ABIEncoderV2;

import "@opengsn/contracts/src/forwarder/IForwarder.sol";
import "@opengsn/contracts/src/BasePaymaster.sol";

contract Paymaster is BasePaymaster {
	/// @dev allowed contract addresses
	mapping(address => bool) public allowed;

	/// @dev emitted after a relayed transaction.
	event Relayed(
		uint _gasUsed,
		uint _gasPrice,
		uint _pctRelayFee,
		uint _baseRelayFee
	);

	/// See {IPaymaster-preRelayedCall}
	function preRelayedCall(
		GsnTypes.RelayRequest calldata relayRequest,
		bytes calldata signature,
		bytes calldata approvalData,
		uint256 maxPossibleGas
	)
		external
		override
		virtual
		relayHubOnly
		returns (bytes memory context, bool revertOnRecipientRevert)
	{
		(signature, approvalData, maxPossibleGas);
		_verifyForwarder(relayRequest);
		require(allowed[relayRequest.request.to]);
    return ("", false);
	}

	/// See {IPaymaster-postRelayedCall}
	function postRelayedCall(
		bytes calldata context,
		bool success,
		uint256 gasUseWithoutPost,
		GsnTypes.RelayData calldata relayData
	)
		external
		override
		virtual
		relayHubOnly
	{
    (context, success);
    emit Relayed(
			gasUseWithoutPost,
			relayData.gasPrice,
			relayData.pctRelayFee,
			relayData.baseRelayFee
    );
	}

	/// Add an address to the list of allowed contracts.
	///
	/// @param _target Address of the contract.
	function allowAddress(address _target) external onlyOwner {
		allowed[_target] = true;
	}

	/// Remove an address from the list of allowed contracts.
	///
	/// @param _target Address of the contract.
	function revokeAddress(address _target) external onlyOwner {
		allowed[_target] = false;
	}

	/// @dev see {IPaymaster-versionPaymaster}
  function versionPaymaster() external virtual view override returns (string memory) {
    return "2.2.3";
  }
}
