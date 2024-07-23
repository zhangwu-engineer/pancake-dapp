import { ethers } from "ethers"

import { MasterChefABI } from "../abi/MasterChef"

const MASTER_CHEF_ADDRESS = '0xa5f8C5Dbd5F286960b9d90548680aE5ebFf07652'

export const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/')

export const masterChefContract = new ethers.Contract(MASTER_CHEF_ADDRESS, MasterChefABI, provider)
