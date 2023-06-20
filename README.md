# Aave V3 Flash Loan Template

This repository provides a template for implementing a Flash Loan using Aave V3.

## Project Description

The Aave V3 Flash Loan Template is a ready-to-use solution for creating and executing Flash Loans on the Aave V3 lending platform. A Flash Loan allows users to borrow assets without collateral as long as the borrowed amount is returned within the same transaction.

This template includes all the necessary setup and configurations to interact with the Aave V3 protocol and execute Flash Loans. It is built with Hardhat, TypeScript, and integrates with the Aave V3 smart contracts.

## Installation Instructions

To get started with the Aave V3 Flash Loan Template, follow these steps:

1. Clone the repository to your local machine:
   ```
   git clone https://github.com/patrickadeelino/aave-v3-flash-loan-template.git
   ```

2. Navigate to the project directory:
   ```
   cd aave-v3-flash-loan-template
   ```

3. Install the required dependencies:
   ```
   npm install
   ```

## Deploying Flash Loan Contract

To deploy the Flash Loan contract to the Arbitrum network, follow these steps:

1. Open the `hardhat.config.js` file.

2. Update the `networks` object with the desired network configuration. For example, if you want to deploy to the Arbitrum network fork, you can add the following code:

   ```javascript
      networks: {
         hardhat: {
            forking: {
               url: `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
            }
         },
      }
   ```

   Replace `ALCHEMY_API_KEY` with your Alchemy API KEY.

3. Run the following command to deploy the Flash Loan contract to the specified network:

   ```
   npx hardhat run scripts/deploy-flash-loan.ts
   ```

5. After the deployment is successful, the contract address will be displayed in the console, put it in `FLASH_LOAN_CONTRACT` in `.env`.

## Running the Flash Loan

Once you have completed the installation steps and configured the necessary parameters, you can execute the Flash Loan by running the following command:

```
npx hardhat run scripts/execute-flash-loan.ts
```

## Testing

To run the tests for the Flash Loan template, use the following command:

```
npx hardhat test
```

This will execute the test suite and provide the test results