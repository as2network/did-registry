# AS2 - Annex DID Method


This smart contracts can be used to create a new did identity called "as2".  It allows identities to be represented as an object that can perform actions such as updating its did-document, signing messages, and verifying messages from other dids.

## Overview


This repository is based on [ERC-1056](https://github.com/ethereum/EIPs/issues/1056) and is intended to use Ethereum addresses as fully self-managed [Decentralized Identifiers](https://w3c-ccg.github.io/did-spec/#decentralized-identifiers-dids) (DIDs), it allows you to easily create and manage keys for these identities.   It also lets you sign standards compliant [JSON Web Tokens (JWT)](https://jwt.io).



Annex DID provide a scalable identity method for Ethereum addresses that gives any Ethereum address the ability to collect on-chain and off-chain data. Because this DID method allows any Ethereum key pair to become an identity, it is more scalable and privacy-preserving than smart contract based identity methods.

## DID Registry

This library contains the Ethereum contract code that allows the owner of a AS2 DID identity to update the attributes that appear in his DID Document.

These contracts allow Ethereum addresses to present signing information about themselves with no prior registration. It allows them to perform key rotation and specify different keys and services that are used on its behalf for both on and off-chain usage.

Depending on the functionalities that you want to use, there are two smart contracts to create a DID Registry.

1. **DIDRegistry**: It is the basic DID Registry that allows multiple controllers and automatic key rotation.
  The parameters for deployment are:
   - `minKeyRotationTime`:  The minimum time (in seconds) to automatically rotate the controller (each DID can set their own rotation time, but it can be less than this value)
2. **DIDRegistryRecoverable**: It is the advanced DID Registry that allows, in addition to the functions of a basic DID, key recovery.
   The parameters for deployment are:
   - `minKeyRotationTime (uint)`: The minimum time (in seconds) to automatically rotate the controller (inherit from DID Registry)
   - `maxAttempts (uint)`: The maximum number of failed attempts in the reset period
   - `minControllers (uint)`: The minimum number of controller that must have the account to be able to use this feature
   - `resetSeconds (uint)`: The reset time period (in seconds). When the account exceeds the `maxAttempts`, the account must wait to reach the `resetSeconds` time before to call again the function to recover the account.
     When this time period is reached, the keys successfully proved to recover the account will be deleted, in that case is needed to prove again the controllers to recover the account.

The official AS2 DID Registries are deployed on xDai here::

| Registry                | Address                                     | Parameters                   |
|-------------------------|---------------------------------------------|------------------------------|
| DIDRegistry             | 0x  | **minKeyRotationTime**: 3600
| DIDRegistryRecoverable  | 0x  | **minKeyRotationTime**: 3600 <br /> **maxAttempts**: 3 <br /> **minControllers**: 5 <br /> **resetSeconds**: 86400



## DID

A DID is an [Identifier](https://w3c-ccg.github.io/did-spec/#decentralized-identifiers-dids) that allows you to lookup a [DID document](https://w3c-ccg.github.io/did-spec/#did-documents) that can be used to authenticate you and messages created by you.

Any Ethereum account regardless of whether it's a key pair or smart contract based is considered to be an account identifier.

An identity needs no registration.

### Controller

Each identity has a single address which maintains ultimate control over it, which is called the `controller` of the DID. By default, each identity is controlled by itself. 
As ongoing technological and security improvements occur, an owner can repAS2e themselves with any other Ethereum address.

In this new version of smart contract it is possible to have multiple `controllers`  associated to the DID, which allows capabilities of automatic key rotation and on-chain key recovery.

Before changing to a new controller it is necessary to register it:

```solidity
addController(address identity, address controller)
```

After doing that, it is possible now to change controller by calling the following function:

```solidity
changeController(address identity, address controller)
```

Also, if you want to delete one controller, just call the next function: 

```solidity
deleteController(address identity, address controller)
```

In this last case, there are some rules to comply before deleting one controller:
 1. You cannot delete the current controller, for that case it is necessary to change to other controller
 2. You cannot delete the all controllers, you must have at least one controller associated to the DID

### Get current DID Controller 

Ownership of identity is verified by calling the function:

```solidity
identityController(address identity) public view returns(address);
``` 

This returns the address of the current DID controller.

### Setting Attributes

These attributes are set using the function:

```solidity
setAttribute(address identity, bytes32 name, bytes value, uint validity);
```

There is also a version of this function that is called with an externally created signature, that is passed to a transaction funding service.

The externally signed version has the following signature:

```solidity
setAttributeSigned(address identity, uint8 sigV, bytes32 sigR, bytes32 sigS, bytes32 name, bytes value, uint validity);
```

The signature should be signed off the keccak256 hash of the following tightly packed parameters:

`byte(0x19), byte(0), address of registry, nonce[currentOwner], identity, "setAttribute", name, value, validity`

###### Name nomenclature

The name of the attribute added to ERC1056 should follow this format:
`{type}/{controller}/{algotithm}/{enconding}`

Where `{type}` can be:
 - **vm**: for a generic Verification Method
 - **auth**: for an Authentication Method 
 - **asse**: for an Assertion Purpose
 - **keya**: for a Key Agreement
 - **dele**: for a Delegation Key
 - **invo**: for an Invocation Capability Key  
 - **svc**: for a Service

The `{controller}` represents the Verification Method controller, and can be any string DID or DID fragment.

The `{algorithm}` can be one of the following in compliant with the W3C specification https://w3c.github.io/did-spec-registries/:

- **jwk**: JsonWebKey2020,
- **esecp256k1vk**: EcdsaSecp256k1VerificationKey2019,
- **esecp256k1rm**: EcdsaSecp256k1RecoveryMethod2020,
- **edd25519vk**: Ed25519VerificationKey2018,
- **gpgvk**: GpgVerificationKey2020,
- **rsavk**: RsaVerificationKey2018,
- **x25519ka**: X25519KeyAgreementKey2019,
- **ssecp256k1vk**: SchnorrSecp256k1VerificationKey2019

And the `{enconding}` is the Public Key enconding type, the possible values are:

 - **hex**: Hexadecimal -> Produces publicKeyHex field in the DID Document 
 - **base64**: Base64 -> Produces publicKeyBase64 field in the DID Document
 - **base58**: Base58 -> Produces publicKeyBase58 field in the DID Document
 - **pem**: PEM X.509 -> Produces publicKeyPem field in the DID Document

> **Note:** The `{encoding}` only refers to the key encoding in the resolved DID document.
> Attribute values sent to the smart contract registry should always be hex encodings of the raw public key data.

###### Service Endpoints

The name of the attribute should follow this format:

`svc//{type}/hex`

Where: `{type}` is the service type field in the DID Document.

And, the `serviceEndpoint` must be in the `value` field of `setAttribute` function.

### Revoking Attributes

These attributes are revoked using the function:

```solidity
revokeAttribute(address identity, bytes32 name, bytes value);
```

There is also a version of this function that is called with an externally created signature, that is passed to a transaction funding service.

The externally signed version has the following signature:
```solidity
revokeAttributeSigned(address identity, uint8 sigV, bytes32 sigR, bytes32 sigS, bytes32 name, bytes value);
```

The signature should be signed off the keccak256 hash of the following tightly packed parameters:

`byte(0x19), byte(0), address of registry, nonce[currentOwner], identity, "revokeAttribute", name, value`

### Automatic Key Rotation

By default, is disabled for any DID the automatic key rotation. To enable this functionality for a specific account you need to execute the following smart contract method:

```solidity
enableKeyRotation(address identity, uint keyRotationTime);
```

The keyRotationTime must be greater or equal than the `minKeyRotationTime` defined in the constructor of the smart contract.

To disable the automatic key rotation, just execute the next function:

```solidity
disableKeyRotation(address identity);
```

### Key Recovery

The on-chain key recovery is one of the main features of this DID method, however it is optional and therefore we separate this functionality in a different smart contract. 
The `DIDRegistryRecoverable` is a subclass of `DIDRegistry`, and it inherits all the functionality of the base DID Registry such as the Automatic Key Rotation.

The basic operation of key recovery function consist in to prove the ownership of `n/2+1` controllers by executing the `recover` smart contract function signed by each of that controllers.

To prove the ownership of each n/2+1 controller different from the current controller of the DID, you must execute the following steps:

1. Off-chain sign the following function
   ```solidity
   recover(address identity, address controller);
   ``` 
   The signature should be generated using the keccak256 hash of the following tightly packed parameters: `byte(0x19), byte(0), address of did registry, 0, identity, "recover", controller`
2. Extract the `R`, `S`, `V` parameters of the previous signature
3. Send a transaction invoking the smart contract function
   ```solidity
   recover(address identity, v, r, s, address controller);
   ``` 
   Where, `identity` is always the original DID address and `controller` is the current controller that is trying to prove the ownership.

When it is successfully proven the ownership of `n/2+1` controllers, the current controller of the DID will be changed to the **last controller proved**.

## DID Document

The primary controller of the DID should be looked up using `identityController(identity)`. 

### Reading attributes

Attributes are stored as `DIDAttributeChanged` events. A `validTo` of 0 indicates a revoked attribute.

```solidity
event DIDAttributeChanged(
    address indexed identity,
    bytes32 name,
    bytes value,
    uint validTo,
    uint previousChange
  );
```



Annex DID provides a scalable identity method for Ethereum addresses that gives any Ethereum address the ability to collect on-chain and off-chain data. 
Because this DID method allows any Ethereum key pair to become an identity, it is more scalable and privacy-preserving than smart contract based identity methods.

## Additional features to ERC-1056

 - Allow multiple controllers
 - Allow to define a controller for each Verification Method
 - Allow automatic key rotation
 - Allow controller key recovery

## DID Method Name

The 'name string' that shall identify this DID method is: `as2`

A DID that uses this method MUST begin with the following prefix: `did:as2`. Per the DID specification, this string MUST be in lowercase. The remainder of the DID, after the prefix, is specified below.

## Method Specific Identifier

The method specific identifier is composed by an optional Ethereum network identifier with a `:` separator, followed by a Hex-encoded Ethereum address (without a `0x` prefix).

	as2-did = "did:as2:" as2-specific-idstring
	as2-specific-idstring = [as2-network  ":" ] as2-address
	as2-network  = "main"
	as2-address  = "0x" 40*HEXDIG

The `as2-address` is case-insensitive.

This specification currently only supports any Ethereum-based network, but in the future will support EOSIO networks.

### Example

Example `as2` DIDs:

* `did:as2:0x086132aF06003626B03B850beaD54F5Ca68543b0`
* `did:as2:main:0x086132aF06003626B03B850beaD54F5Ca68543b0`

## DID Document

### Example
```json
{
	"@context": "https://www.w3.org/ns/did/v1",
	"id": "did:as2:main:0xadf1702b76419f428014d1386af487b2d8145f83",
	"controller": ["did:as2:main:0xadf1702b76419f428014d1386af487b2d8145f83"],
	"verificationMethod": [
		{
			"id": "did:as2:main:0xadf1702b76419f428014d1386af487b2d8145f83#vm-0",
			"type": "Secp256k1VerificationKey2018",
			"controller": "did:as2:main:0xadf1702b76419f428014d1386af487b2d8145f83",
			"publicKeyHex": "0xadf1702b76419f428014d1386af487b2d8145f83"
		}
	],
	"authentication": [
		"did:as2:main:0xadf1702b76419f428014d1386af487b2d8145f83#vm-0"
	],
	"capabilityInvocation": [
		"did:as2:main:0xadf1702b76419f428014d1386af487b2d8145f83#vm-0"
	],
	"capabilityDelegation": [
		"did:as2:main:0xadf1702b76419f428014d1386af487b2d8145f83#vm-0"
	],
	"assertionMethod": [
		"did:as2:main:0xadf1702b76419f428014d1386af487b2d8145f83#vm-0"
	],
	"keyAgreement": [
		"did:as2:main:0xadf1702b76419f428014d1386af487b2d8145f83#vm-0"
	],
	"service": [
		{
			"id":"did:as2:main:0xadf1702b76419f428014d1386af487b2d8145f83#mailbox",
			"type": "DIDComm",
			"serviceEndpoint": "https://mailbox.Annex.net"
		}
	]
}
```
## CRUD Operation Definitions

### Create (Register)

In order to create a `as2` DID, an Ethereum address, i.e., key pair, needs to be generated.

At this point, no interaction with the target Ethereum network is required. 

### Read (Resolve)

To construct a valid DID document, first find all changes in history for an identity:

1. eth_call changed(address identity) on the DID Registry smart contract to get the latest block where a change occurred.
2. If result is null return.
3. Filter for events for all the above types with the contracts address on the specified block.
4. If event has a previous change then go to 3

After building the history of events for an address, interpret each event to build the DID document like so:

#### Attributes (`DIDAttributeChanged`)

Verification Methods, Service Endpoints, etc. can be added using attributes. Attributes only exist on the blockchain as
contract events of type `DIDAttributeChanged` and can thus not be queried from within solidity code.

```solidity
event DIDAttributeChanged(
  address indexed identity,
  bytes name,
  bytes value,
  uint validTo,
  uint previousChange
);
```

While any attribute can be stored, for the DID document we currently support adding to each of these sections of the DID
document:

- Verification Methods
- Service Endpoints

###### Verification Methods

The name of the attribute added should follow this format:
`{type}/{controller}/{algotithm}/{enconding}`

Where `{type}` can be:
- **vm**: for a generic Verification Method
- **auth**: for an Authentication Method
- **asse**: for an Assertion Purpose
- **keya**: for a Key Agreement
- **dele**: for a Delegation Key
- **invo**: for an Invocation Capability Key
- **svc**: for a Service

The `{controller}` represents the Verification Method controller, and can be any string DID or DID fragment.

The `{algorithm}` can be one of the following in compliant with the W3C specification https://w3c.github.io/did-spec-registries/:

- **jwk**: JsonWebKey2020,
- **esecp256k1vk**: EcdsaSecp256k1VerificationKey2019,
- **esecp256k1rm**: EcdsaSecp256k1RecoveryMethod2020,
- **edd25519vk**: Ed25519VerificationKey2018,
- **gpgvk**: GpgVerificationKey2020,
- **rsavk**: RsaVerificationKey2018,
- **x25519ka**: X25519KeyAgreementKey2019,
- **ssecp256k1vk**: SchnorrSecp256k1VerificationKey2019

And the `{enconding}` is the Public Key encoding type, the possible values are:

- **hex**: Hexadecimal -> Produces publicKeyHex field in the DID Document
- **base64**: Base64 -> Produces publicKeyBase64 field in the DID Document
- **base58**: Base58 -> Produces publicKeyBase58 field in the DID Document
- **pem**: PEM X.509 -> Produces publicKeyPem field in the DID Document

> **Note:** The `{encoding}` only refers to the key encoding in the resolved DID document.
> Attribute values sent to the smart contract registry should always be hex encodings of the raw public key data.

###### Service Endpoints

The name of the attribute should follow this format:

`svc//{type}/hex`

Where: `{type}` is the service type field in the DID Document.

And, the `serviceEndpoint` must be in the `value` field of `setAttribute` function.

#### Controller

Each identity has a single address which maintains ultimate control over it, which is called the `controller` of the DID. By default, each identity is controlled by itself.
As ongoing technological and security improvements occur, an owner can repAS2e themselves with any other Ethereum address.

In this new version of smart contract it is possible to have multiple `controllers`  associated to the DID, which allows capabilities of automatic key rotation and on-chain key recovery.

Before changing to a new controller it is necessary to register it:

```solidity
addController(address identity, address controller);
```

After doing that, it is possible now to change controller by calling the following function:

```solidity
changeController(address identity, address controller);
```

Also, if you want to delete one controller, just call the next function:

```solidity
deleteController(address identity, address controller);
```

In this last case, there are some rules to comply before deleting one controller:
1. You cannot delete the current controller, for that case it is necessary to change to other controller
2. You cannot delete the all controllers, you must have at least one controller associated to the DID


### Update

The DID Document may be updated by invoking the relevant smart contract functions as defined by the DID Registry smart contract. 
This includes changes to the identity controller and adding additional attributes.

These functions will trigger the respective Ethereum events which are used to build the DID Document for a given identity as described in Enumerating Contract Events to build the DID Document.

DID attributes of the DID Document will be revoked automatically when their validity period expires.

### Delete (Revoke)

To revoke a DID, the controller of the DID needs to be set to `0x0`. Although, `0x0` is a valid Ethereum address, this will indicate the identity has no controller which is a common approach for invalidation.

```solidity
changeController(address identity, '0x0');
```

If there is any other changes to the DID document after such a change,  all preexisting keys and services will be considered revoked.

## Security and Privacy Considerations

There are some features that this DID method implements related to security and privacy.

### Automatic Key Rotation

Automatic key rotation allows automatically and individually per DID account to rotate the main DID controller. The purpose of this mechanism is to increase the security of the full control of the DID document.

By default, is disabled for any DID the automatic key rotation. To enable this functionality for a specific account you need to execute the following smart contract method:

```solidity
enableKeyRotation(address identity, uint keyRotationTime);
```

The keyRotationTime must be greater or equal than the `minKeyRotationTime` defined in the constructor of the smart contract.

To disable the automatic key rotation, just execute the next function:

```solidity
disableKeyRotation(address identity);
```

### Key Recovery

The on-chain key recovery is one of the main features of this DID method, however it is optional and therefore we separate this functionality in a different smart contract.
The main idea of this mechanism is to be able to regain full control of the DID by testing control of other controllers registered in the DID. 
The `DIDRegistryRecoverable` is a subclass of `DIDRegistry`, and it inherits all the functionality of the base DID Registry such as the Automatic Key Rotation.

The basic operation of key recovery function consist in to prove the ownership of `n/2+1` controllers by executing the `recover` smart contract function signed by each of that controllers.

To prove the ownership of each n/2+1 controller different from the current controller of the DID, you must execute the following steps:

1. Off-chain sign the following function
   ```solidity
   recover(address identity, address controller);
   ``` 
   The signature should be generated using the keccak256 hash of the following tightly packed parameters: `byte(0x19), byte(0), address of did registry, 0, identity, "recover", controller`
2. Extract the `R`, `S`, `V` parameters of the previous signature
3. Send a transaction invoking the smart contract function
   ```solidity
   recover(address identity, v, r, s, address controller);
   ``` 
   Where, `identity` is always the original DID address and `controller` is the current controller that is trying to prove the ownership.

When it is successfully proven the ownership of `n/2+1` controllers, the current controller of the DID will be changed to the **last controller proved**.

