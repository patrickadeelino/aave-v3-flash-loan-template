import { ethers, network } from "hardhat";

const POOL_ADDRESSES_PROVIDER = '0xa97684ead0e402dc232d5a977953df7ecbab3cdb';

async function main() {
    console.log('Deploying FlashLoan.sol');
    const FlashLoan = await ethers.getContractFactory("FlashLoan")
    const flashLoan = await FlashLoan.deploy(POOL_ADDRESSES_PROVIDER);
    await flashLoan.deployed();

    console.log(`Contract deployed at: ${flashLoan.address}`);
}

main().catch((error) => {
    console.log(error);
    process.exitCode = 1;
})