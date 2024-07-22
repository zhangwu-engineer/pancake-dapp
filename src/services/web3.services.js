import { ethers } from "ethers"

import { pancakeMasterChefABI } from "../abi/PancakeSwapMasterChef"

const MASTER_CHEF_ADDRESS = '0x73feaa1ee314f8c655e354234017be2193c9e24e'

export const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/')

export const masterChefContract = new ethers.Contract(MASTER_CHEF_ADDRESS, pancakeMasterChefABI, provider)
