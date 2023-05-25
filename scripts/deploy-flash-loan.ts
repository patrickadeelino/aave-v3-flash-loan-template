import { ethers, network } from "hardhat";

async function main() {
    console.log('Deploying FlashLoan.sol');
    console.log(network)
    const FlashLoan = await ethers.getContractFactory("FlashLoan")
    const flashLoan = await FlashLoan.deploy('0xa97684ead0e402dc232d5a977953df7ecbab3cdb');
    await flashLoan.deployed();

    console.log(`Contract deployed at: ${flashLoan.address}`);
}

main().catch((error) => {
    console.log(error);
    process.exitCode = 1;
})