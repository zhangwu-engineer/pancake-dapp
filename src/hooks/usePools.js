import { useCallback, useEffect, useState } from 'react';
import { ethers } from 'ethers';

import { masterChefContract, provider } from '../services/web3.services';
import { PancakePairABI } from '../abi/PancakePair';
import { erc20ABI } from '../abi/erc20';
import { generateRandomIndices } from '../utils/helpers';
import { PANCAKE_LP_TOKEN_NAME } from '../utils/constants';

const usePools = () => {
  const [pools, setPools] = useState([]);
  const [isLoading, setIsLoading] = useState(false)
  const [failedTokens, setFailedTokens] = useState([])
  const [isRetrying, setIsRetrying] = useState(false)

  const fetchData = useCallback(async (isActive) => {
    try {
      setIsLoading(true)
      setFailedTokens([])
      const totalAllocPointRes = await masterChefContract.totalSpecialAllocPoint();
      console.log('Total Alloc Point:', totalAllocPointRes.toString());
      const cakePerBlockRes = await masterChefContract.MASTERCHEF_CAKE_PER_BLOCK();
      console.log('Cake Per Block:', cakePerBlockRes.toString());
      const poolLength = await masterChefContract.poolLength();
      console.log('Pool Length:', poolLength.toString());

      const randomIndices = generateRandomIndices(poolLength, 12)
      const poolAddressPromises = randomIndices.map(i => masterChefContract.lpToken(i))
      const poolInfoPromises = randomIndices.map(i => masterChefContract.poolInfo(i))

      const lpTokenAddressesRes = await Promise.all(poolAddressPromises);

      const poolsData = await Promise.all(poolInfoPromises);
      const poolsDataWithID = poolsData.map((p, id) => ({
        id,
        data: p,
      }))

      const filteredPools = poolsDataWithID.filter(pool => {
        if (isActive) return pool.data.allocPoint !== 0n;
        return pool.data.allocPoint === 0n;
      });
      const activePools = await Promise.all(
        filteredPools.map(async (pDataWithID) => {
          const { data: pool, id } = pDataWithID
          const lpAddress = lpTokenAddressesRes[id]
          try {
            let token0
            if (id % 2 === 0) {
              token0 = await lpToken.token0();
            }
            const lpToken = new ethers.Contract(lpAddress, PancakePairABI, provider);
            const tokenName = await lpToken.name()
            if (tokenName === PANCAKE_LP_TOKEN_NAME) {
              // const token0 = await lpToken.token0();
              if (id % 2 !== 0) {
                token0 = await lpToken.token0();
              }
              const token1 = await lpToken.token1();
              const token0Contract = new ethers.Contract(token0, erc20ABI, provider);
              const token1Contract = new ethers.Contract(token1, erc20ABI, provider);
              const token0Symbol = await token0Contract.symbol();
              const token1Symbol = await token1Contract.symbol();

              return {
                lpToken: lpAddress,
                allocPoint: pool.allocPoint.toString(),
                token0Symbol: token0Symbol,
                token1Symbol: token1Symbol,
                rewardTokensPerBlock: (cakePerBlockRes * (pool.allocPoint / totalAllocPointRes)).toString(),
                percentage: ((pool.allocPoint / totalAllocPointRes)).toString(),
              };
            } else {
              return null
            }
          } catch (error) {
            console.error('Error fetching token data:', error);
            setFailedTokens(prev => [...prev, {
              pool,
              lpAddress,
              cakePerBlock: cakePerBlockRes,
              totalAllocPoint: totalAllocPointRes
            }])
            return null;
          }
        })
      );


      console.log(activePools.filter((p) => p), 'activePools')

      setPools(activePools.filter((p) => p));
      setIsLoading(false)

    } catch (error) {
      console.error('Error fetching pool data:', error);
      setIsLoading(false)
    }
  }, []);

  const retryFailedTokens = useCallback(async () => {
    setIsRetrying(true)
    const retriedPools = await Promise.all(
      failedTokens.map(async (data) => {
        try {
          const { pool, lpAddress, cakePerBlock, totalAllocPoint } = data
          const lpToken = new ethers.Contract(lpAddress, PancakePairABI, provider);
          const tokenName = await lpToken.name();
          if (tokenName === PANCAKE_LP_TOKEN_NAME) {
            const token0 = await lpToken.token0();
            const token1 = await lpToken.token1();
            const token0Contract = new ethers.Contract(token0, erc20ABI, provider);
            const token1Contract = new ethers.Contract(token1, erc20ABI, provider);
            const token0Symbol = await token0Contract.symbol();
            const token1Symbol = await token1Contract.symbol();

            return {
              lpToken: lpAddress,
              allocPoint: pool.allocPoint.toString(),
              token0Symbol: token0Symbol,
              token1Symbol: token1Symbol,
              rewardTokensPerBlock: (cakePerBlock * (pool.allocPoint / totalAllocPoint)).toString(),
              percentage: ((pool.allocPoint / totalAllocPoint)).toString(),
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
    console.log(failedTokens, 'failed')
    console.log(successfulRetries, 'successres')
    if (successfulRetries.length > 0) {
      setPools(prevPools => [...prevPools, ...successfulRetries]);
      const successLPAddresses = successfulRetries.map(success => success.lpToken)
      console.log(successLPAddresses, 'successLPAddresses')
      console.log(failedTokens.filter(failedItem => !successLPAddresses.includes(failedItem.lpAddress)), 'newFilter')
      setFailedTokens(prev => {
        return prev.filter(failedItem => !successLPAddresses.includes(failedItem.lpAddress))
      });
    }
    setIsRetrying(false)
  }, [failedTokens]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (failedTokens.length > 0 && !isRetrying && !isLoading) {
      const interval = setInterval(() => {
        retryFailedTokens()
      }, 5000); // Retry every 10 seconds
      return () => clearInterval(interval); // Clear interval on cleanup
    }
  }, [failedTokens, isLoading, isRetrying, retryFailedTokens]);

  console.log(failedTokens, 'failedTOkens')
  return { pools, isLoading, fetchData, isRetrying };
};

export default usePools;
