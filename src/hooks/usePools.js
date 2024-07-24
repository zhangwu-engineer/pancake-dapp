import { useCallback, useEffect, useState } from 'react';
import { ethers } from 'ethers';

import { masterChefContract, provider } from '../services/web3.services';
import { PancakePairABI } from '../abi/PancakePair';
import { erc20ABI } from '../abi/erc20';
import { fetchTokenPrices, generateRandomIndices } from '../utils/helpers';
import { PANCAKE_LP_TOKEN_NAME } from '../utils/constants';

const usePools = () => {
  const [pools, setPools] = useState([]); // pools is for saving the pools data 
  const [isFailed, setIsFailed] = useState(false) // true when MasterChef contract function calling is failed
  const [failedCount, setFailedCount] = useState(0) // failed count of getting MasterChef contract function calling
  const [isLoading, setIsLoading] = useState(false) // true while getting pools data
  const [failedTokens, setFailedTokens] = useState([]) // token addresses that are failed for getting LP token info
  const [failedTokenCount, setFailedTokenCount] = useState(0) // failed count of getting failed LP token info
  const [isRetrying, setIsRetrying] = useState(false) // true while retrying to get failed LP token info
  const [cakeAddrs, setCakeAddrs] = useState([]) // cake token addresses that will be used for Coingecko API calling

  const fetchData = useCallback(async (isActive) => {
    try {
      // Initialize state values
      setIsLoading(true)
      setPools([])
      setIsFailed(false)
      setCakeAddrs([])
      setFailedTokens([])

      // get MasterChef contract info
      const totalAllocPointRes = await masterChefContract.totalSpecialAllocPoint();
      console.log('Total Alloc Point:', totalAllocPointRes.toString());
      const cakePerBlockRes = await masterChefContract.MASTERCHEF_CAKE_PER_BLOCK();
      console.log('Cake Per Block:', cakePerBlockRes.toString());
      const poolLength = await masterChefContract.poolLength();
      console.log('Pool Length:', poolLength.toString());

      const cakeAddress = await masterChefContract.CAKE()

      console.log(cakeAddress, 'cakeAddress')
      const { tokenPrices } = await fetchTokenPrices([cakeAddress.toString()])
      const cakePrice = tokenPrices[cakeAddress.toString().toLowerCase()]?.usd || 0
      console.log(cakePrice, 'cakeprice')

      // generate random 12 indices and get randomly select 12 lpToken data
      const randomIndices = generateRandomIndices(poolLength, 12)

      const poolAddressPromises = randomIndices.map(i => masterChefContract.lpToken(i))
      const poolInfoPromises = randomIndices.map(i => masterChefContract.poolInfo(i))

      const lpTokenAddressesRes = await Promise.all(poolAddressPromises);

      const poolsData = await Promise.all(poolInfoPromises);
      const poolsDataWithID = poolsData.map((p, id) => ({
        id,
        data: p,
      }))

      // filter active/inactive pools based in the user filter

      const filteredPools = poolsDataWithID.filter(pool => {
        if (isActive) return pool.data.allocPoint !== 0n;
        return pool.data.allocPoint === 0n;
      });

      let newFailedTokens = []
      const finalPools = await Promise.all(
        filteredPools.map(async (pDataWithID, idx) => {
          const { data: pool, id } = pDataWithID
          const lpAddress = lpTokenAddressesRes[id]
          try {

            const lpToken = new ethers.Contract(lpAddress, PancakePairABI, provider);
            //----------------------------------------
            // const tokenName = await lpToken.name()
            const tokenName = await lpToken.names() // used the incorrect name to making an error manually
            //----------------------------------------

            if (tokenName === PANCAKE_LP_TOKEN_NAME) { // check if it's a real LP token
              const token0 = await lpToken.token0();
              const token1 = await lpToken.token1();
              const token0Contract = new ethers.Contract(token0, erc20ABI, provider);
              const token1Contract = new ethers.Contract(token1, erc20ABI, provider);
              const token0Symbol = await token0Contract.symbol();
              const token1Symbol = await token1Contract.symbol();

              // getReserves info for Bonus point
              const reserves = await lpToken.getReserves()
              const { _reserve0: reserve0, _reserve1: reserve1 } = reserves

              const totalSupply = await lpToken.totalSupply();
              const rewardPerBlock = cakePerBlockRes * (pool.allocPoint / totalAllocPointRes);

              setCakeAddrs(prev => [...prev, token0.toString().toLowerCase(), token1.toString().toLowerCase()])

              return {
                lpToken: lpAddress,
                allocPoint: Number(pool.allocPoint),
                token0,
                token1,
                token0Symbol: token0Symbol,
                token1Symbol: token1Symbol,
                rewardPerBlock: Number(rewardPerBlock),
                cakePrice: Number(cakePrice),
                percentage: ((pool.allocPoint / totalAllocPointRes)),
                totalSupply: Number(totalSupply),
                reserve0: Number(reserve0),
                reserve1: Number(reserve1)
              };
            } else {
              return null
            }
          } catch (error) {
            console.error('Error fetching token data:', error);
            newFailedTokens.push({
              pool,
              lpAddress,
              cakePerBlock: cakePerBlockRes,
              totalAllocPoint: totalAllocPointRes,
              cakePrice,
            })
            return null;
          }
        })
      );

      setFailedTokens(newFailedTokens)

      console.log(finalPools.filter((p) => p), 'finalPools')
      setPools(finalPools.filter((p) => p));
      setIsFailed(false)
      setFailedCount(0)
      setIsLoading(false)

    } catch (error) {
      console.error('Error fetching pool data:', error);
      setFailedCount(prev => prev + 1)
      setIsFailed(true)
      setIsLoading(false)
    }
  }, []);

  // function for retry getting failed LP tokens info
  const retryFailedTokens = useCallback(async () => {
    setIsRetrying(true)
    setFailedTokenCount(prev => prev + 1)
    const retriedPools = await Promise.all(
      failedTokens.map(async (data) => {
        try {
          const { pool, lpAddress, cakePerBlock, totalAllocPoint, cakePrice } = data
          const lpToken = new ethers.Contract(lpAddress, PancakePairABI, provider);
          const tokenName = await lpToken.name();
          if (tokenName === PANCAKE_LP_TOKEN_NAME) {
            const token0 = await lpToken.token0();
            const token1 = await lpToken.token1();
            setCakeAddrs(prev => [...prev, token0.toString().toLowerCase(), token1.toString().toLowerCase()])
            const token0Contract = new ethers.Contract(token0, erc20ABI, provider);
            const token1Contract = new ethers.Contract(token1, erc20ABI, provider);
            const token0Symbol = await token0Contract.symbol();
            const token1Symbol = await token1Contract.symbol();

            const reserves = await lpToken.getReserves()
            const { _reserve0: reserve0, _reserve1: reserve1 } = reserves

            const totalSupply = await lpToken.totalSupply();

            const rewardPerBlock = cakePerBlock * (pool.allocPoint / totalAllocPoint);

            return {
              lpToken: lpAddress,
              allocPoint: Number(pool.allocPoint),
              token0,
              token1,
              token0Symbol: token0Symbol,
              token1Symbol: token1Symbol,
              rewardPerBlock: Number(rewardPerBlock),
              cakePrice: Number(cakePrice),
              percentage: ((pool.allocPoint / totalAllocPoint)),
              totalSupply: Number(totalSupply),
              reserve0: Number(reserve0),
              reserve1: Number(reserve1)
            };
          } else {
            return null;
          }
        } catch (error) {
          console.error('Error fetching token data:', error);
          return null;
        }
      })
    );

    const successfulRetries = retriedPools.filter(p => p);
    if (successfulRetries.length > 0) {
      // append new success pools data to the pools array
      setPools(prevPools => [...prevPools, ...successfulRetries]);
      const successLPAddresses = successfulRetries.map(success => success.lpToken)

      // filter the success token addresses from teh failed addresses
      setFailedTokens(prev => {
        return prev.filter(failedItem => !successLPAddresses.includes(failedItem.lpAddress))
      });
    }
    setIsRetrying(false)
  }, [failedTokens]);

  useEffect(() => {
    if (failedTokens.length > 0 && !isRetrying && !isLoading && failedTokenCount < 6) {
      const interval = setInterval(() => {
        retryFailedTokens()
      }, 3000); // Retry getting failed LP token data every 3 seconds (5 times totally)
      return () => clearInterval(interval); // Clear interval on cleanup
    }
  }, [failedTokenCount, failedTokens, isLoading, isRetrying, retryFailedTokens]);

  useEffect(() => {
    if (isFailed && !isLoading && failedCount < 4) {
      const interval = setInterval(() => {
        fetchData()
      }, 15000); // Retry getting MasterChef contract data every 15 seconds (3 times totally)
      return () => clearInterval(interval); // Clear interval on cleanup
    }
  }, [failedCount, fetchData, isFailed, isLoading]);

  console.log(failedTokens, 'failedTOkens')
  return { pools, isLoading, fetchData, isRetrying, cakeAddrs: [...new Set(cakeAddrs)], failedCount };
};

export default usePools;
