# Pods (PoolTogether)

[![<PoolTogether>](https://circleci.com/gh/pooltogether/pods-v3-contracts.svg?style=shield)](https://circleci.com/gh/pooltogether/pods-v3-contracts) [![Coverage Status](https://coveralls.io/repos/github/pooltogether/pods-v3-contracts/badge.svg?branch=pod/tests)](https://coveralls.io/github/pooltogether/pods-v3-contracts?branch=pod/tests)

The Pods smart contracts are a periphery smart contract collection for PoolTogether

- Lower Gas Fees
- Increased Chances of Winning

### Overview

The smart contracts are categorized into multiple categories

### Primary

The primary smart contracts are responsible for handling collective deposits and issuing POOL rewards

- Pod
- TokenDrop

### Factories

The factory smart contracts are responsible for deploying new Pods associated TokenDrop

- PodFactory
- TokenDropFactory

### Periphery

The periphery smart contracts help handle secondary actions, like liquidating "bonus" rewards from LOOT boxes.

- PodManager

## Development

The development, testing and deployment is handled via `hardhat`

## Testing

Run All Tests

`yarn test`
