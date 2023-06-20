import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import  * as dotenv from 'dotenv';
dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.10",
  networks: {
    hardhat: {
			forking: {
				url: `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
        blockNumber: 17520408
			}
		},
  }
};

export default config;
