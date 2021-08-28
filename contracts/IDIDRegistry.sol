/// SPDX-License-Identifier: GPL-2.0-Only

pragma solidity >=0.6.0 <0.7.0;

interface IDIDRegistry {
    struct DIDConfig {
        uint256 currentController;
        bool automaticRotation;
        uint256 keyRotationTime;
    }

    event DIDControllerChanged(
        address indexed identity,
        address controller,
        uint256 previousChange
    );

    event DIDAttributeChanged(
        address indexed identity,
        bytes name,
        bytes value,
        uint256 validTo,
        uint256 previousChange
    );

    function addController(address identity, address controller) external;

    function removeController(address identity, address controller) external;

    function changeController(address identity, address newController) external;

    function changeControllerSigned(
        address identity,
        uint8 sigV,
        bytes32 sigR,
        bytes32 sigS,
        address newController
    ) external;

    function setAttribute(
        address identity,
        bytes memory name,
        bytes memory value,
        uint256 validity
    ) external;

    function setAttributeSigned(
        address identity,
        uint8 sigV,
        bytes32 sigR,
        bytes32 sigS,
        bytes memory name,
        bytes memory value,
        uint256 validity
    ) external;

    function revokeAttribute(
        address identity,
        bytes memory name,
        bytes memory value
    ) external;

    function revokeAttributeSigned(
        address identity,
        uint8 sigV,
        bytes32 sigR,
        bytes32 sigS,
        bytes memory name,
        bytes memory value
    ) external;

    function enableKeyRotation(address identity, uint256 keyRotationTime)
        external;

    function disableKeyRotation(address identity) external;
}
