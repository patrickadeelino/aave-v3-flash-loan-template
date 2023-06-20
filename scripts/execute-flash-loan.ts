import { ethers } from "hardhat";

async function main() {
    console.log('Init flash loan');

    const flashLoan = await ethers.getContractAt('FlashLoan', process.env.FLASH_LOAN_CONTRACT);
    console.log(`Contract fetched: ${flashLoan.address}`)

    const [account] = await ethers.getSigners();
    console.log(`Account fetched: ${account.address}`)
    const WETH = '0x82af49447d8a07e3bd95bd0d56f35241523fbab1'
    const amount = ethers.utils.parseUnits('1', "ether")

    const tx = await flashLoan.requestFlashLoan(WETH, amount)
    const result = await tx.wait();

    console.log('Flash loan executed successfully!')
}

main().catch((error) => {
    console.log(error);
    process.exitCode = 1;
})