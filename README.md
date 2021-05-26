<p align="center">
  <a href="https://github.com/pooltogether/pooltogether--brand-assets">
    <img src="https://github.com/pooltogether/pooltogether--brand-assets/blob/977e03604c49c63314450b5d432fe57d34747c66/logo/pooltogether-logo--purple-gradient.png?raw=true" alt="PoolTogether Brand" style="max-width:100%;" width="200">
  </a>
</p>

<br />

# PoolTogether v3 - Pods Smart Contracts

[![<PoolTogether>](https://circleci.com/gh/pooltogether/pods-v3-contracts.svg?style=shield)](https://circleci.com/gh/pooltogether/pods-v3-contracts) [![Coverage Status](https://coveralls.io/repos/github/pooltogether/pods-v3-contracts/badge.svg?branch=pod/tests)](https://coveralls.io/github/pooltogether/pods-v3-contracts?branch=pod/tests) [![built-with openzeppelin](https://img.shields.io/badge/built%20with-OpenZeppelin-3677FF)](https://docs.openzeppelin.com/)

The Pods smart contracts are a periphery smart contract collection for PoolTogether

- Lower Gas Fees
- Increased Chances of Winning

## Setup

Install dependencies:

```bash
$ yarn
```

Make sure you have `direnv` installed and copy `.envrc.example` to `.envrc`:

```bash
$ cp .envrc.example .envrc
```

Fill in your own values for `.envrc`, then run:

```bash
$ direnv allow
```

To setup the local Hardhat EVM, run:

```
$ yarn hardhat node
```

Depending on the .enrvc setup the Hardhat EVM will be new blockchain or a mainnet fork.

## Overview

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
