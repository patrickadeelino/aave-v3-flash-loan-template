import { expect } from "chai"
import { ethers } from "hardhat"
import { abi as IUniswapV3PoolABI } from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import { abi as SwapRouterABI } from '@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json'
import { FlashLoan, FlashLoan__factory, IERC20 } from "../typechain-types"
import { legos } from "@studydefi/money-legos";
require("dotenv").config()

describe("FlashLoan on Arbitrum", function () {
    let flashLoan: FlashLoan;
    let weth: IERC20;
    let account;
    const WETH = '0x82af49447d8a07e3bd95bd0d56f35241523fbab1'
    const DAI = '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1';

    beforeEach(async () => {
        const Flashloan: FlashLoan__factory = await ethers.getContractFactory("FlashLoan")
        flashLoan = await Flashloan.deploy('0xa97684ead0e402dc232d5a977953df7ecbab3cdb')
        await flashLoan.deployed();
        [account] = await ethers.getSigners()

        weth = await ethers.getContractAt(legos.erc20.weth.abi, '0x82af49447d8a07e3bd95bd0d56f35241523fbab1')
        console.log('Supplying 5 WETH token to FlashLoan contract.')
        console.log(`Flash loan WETH balance before: ${await weth.balanceOf(flashLoan.address)}`)
        await account.sendTransaction({
            to: weth.address,
            value: ethers.utils.parseUnits('10', "ether")
        })
        await weth.transfer(flashLoan.address, ethers.utils.parseUnits('5', "ether"))
    })

    describe("Basic Flashloan using AAVE V3", () => {
        it('Borrows 100 WETH from Aave', async () => {
            const requestedAmount = ethers.utils.parseUnits('100', "ether")
            const tx = await flashLoan.requestFlashLoan(WETH, requestedAmount)
            const result = await tx.wait();

            const loanedTokenAdress = result.logs[0].address;
            const [to] = ethers.utils.defaultAbiCoder.decode(['address'], result.logs[0].topics[2])
            const [receivedValue] = ethers.utils.defaultAbiCoder.decode(['uint'], result.events[0].data)

            expect(loanedTokenAdress.toLowerCase()).to.equal(WETH.toLowerCase())
            expect(to).to.equal(flashLoan.address)
            expect(receivedValue).to.equal(requestedAmount)
        })

        it('Swaps WETH for DAI and borrows 200K DAI from Aave', async () => {
            const poolAddress = '0xa961f0473da4864c5ed28e00fcc53a3aab056c1b'; // WETH/DAI - fee 0.3%
            const poolContract = await ethers.getContractAt(IUniswapV3PoolABI, poolAddress);
            const [token0, token1, fee] = await Promise.all([
                poolContract.token0(),
                poolContract.token1(),
                poolContract.fee()
            ])
            const swapRouterV3Address = '0xE592427A0AEce92De3Edee1F18E0157C05861564';
            const swapRouter = await ethers.getContractAt(SwapRouterABI, swapRouterV3Address)
            await weth.approve(swapRouter.address, ethers.utils.parseUnits('1', "ether"), { from: account.address })
            await swapRouter.exactInputSingle({
                tokenIn: token0,
                tokenOut: token1,
                fee: fee,
                recipient: account.address,
                deadline: Math.floor(Date.now() / 1000) + (60 * 10),
                amountIn: ethers.utils.parseUnits('1', "ether"),
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0,
            });

            console.log("Sending DAI to contract to pay the fees.");
            const daiContract: IERC20 = await ethers.getContractAt(legos.erc20.dai.abi, DAI);
            await daiContract.transfer(flashLoan.address, ethers.utils.parseUnits('1000', "ether"));
            const contractDAIBalanceBeforeFlashLoan = await daiContract.balanceOf(flashLoan.address);

            const requestedAmount = ethers.utils.parseUnits('200000', "ether")
            const tx = await flashLoan.requestFlashLoan(DAI, requestedAmount)
            const result = await tx.wait();

            // Decode the first transfer event emitted from the transaction
            const loanedTokenAdress = result.logs[0].address;
            const [to] = ethers.utils.defaultAbiCoder.decode(['address'], result.logs[0].topics[2])
            const [receivedValue] = ethers.utils.defaultAbiCoder.decode(['uint'], result.events[0].data)

            expect(loanedTokenAdress.toLowerCase()).to.equal(DAI.toLowerCase())
            expect(to).to.equal(flashLoan.address)
            expect(receivedValue).to.equal(requestedAmount)
            const finalContractDAIBalance = await daiContract.balanceOf(flashLoan.address);
            const flashLoanFeeInDAI =  contractDAIBalanceBeforeFlashLoan - finalContractDAIBalance;
            console.table({ 
                'BORROWED AMOUNT (DAI)': await ethers.utils.formatEther(receivedValue.toString()),
                'FLASH LOAN FEE (DAI)': await ethers.utils.formatEther(flashLoanFeeInDAI.toString()),
                'INITIAL CONTRACT BALANCE (DAI)': await ethers.utils.formatEther(contractDAIBalanceBeforeFlashLoan.toString()),
                'FINAL CONTRACT BALANCE (DAI)': await ethers.utils.formatEther(finalContractDAIBalance.toString()),
            })
        })
    })

    describe('Withdraw', () => {
        it('transfers the token balance to the owner', async () => {
            const tokenContract: IERC20 = await ethers.getContractAt(legos.erc20.dai.abi, WETH);
            const ownerBalanceBefore = await tokenContract.balanceOf(account.address);
            const contractBalanceBefore = await tokenContract.balanceOf(flashLoan.address);
            await flashLoan.withdraw(WETH);
            const ownerBalanceAfter = await tokenContract.balanceOf(account.address);
            const contractBalanceAfter = await tokenContract.balanceOf(flashLoan.address);

            expect(contractBalanceAfter).to.equal(0);
            expect(contractBalanceAfter).to.lessThan(contractBalanceBefore);
            expect(ownerBalanceAfter).to.greaterThan(ownerBalanceBefore)
            expect(ownerBalanceAfter).to.equal(ownerBalanceBefore.add(contractBalanceBefore))
        })

        it('allows calls only from contract owner', async () => {
            let [owner, notContractOwner] = await ethers.getSigners();
            await expect(
                flashLoan.connect(notContractOwner).withdraw(WETH)
            ).to.be.revertedWith('Only the contract owner can call this function');
        })
    })
});