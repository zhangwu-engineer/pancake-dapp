import { useCallback, useEffect, useState } from 'react';
import { ethers } from 'ethers';

import { masterChefContract, provider } from '../services/web3.services';
import { PancakePairABI } from '../abi/PancakePair';
import { erc20ABI } from '../abi/erc20';
import { generateRandomIndices } from '../utils/helpers';
import { PANCAKE_LP_TOKEN_NAME } from '../utils/constants';

const usePools = () => {
  const [pools, setPools] = useState([]);
  const [totalAllocPoint, setTotalAllocPoint] = useState(0);
  const [cakePerBlock, setCakePerBlock] = useState(0);
  const [isLoading, setIsLoading] = useState(false)

  const fetchData = useCallback(async (isActive = true) => {
    setIsLoading(true)
    try {
      const totalAllocPointRes = await masterChefContract.totalSpecialAllocPoint();
      console.log('Total Alloc Point:', totalAllocPointRes.toString());
      setTotalAllocPoint(totalAllocPointRes);
      const cakePerBlockRes = await masterChefContract.MASTERCHEF_CAKE_PER_BLOCK();
      setCakePerBlock(cakePerBlockRes);
      console.log('Cake Per Block:', cakePerBlockRes.toString());
      const poolLength = await masterChefContract.poolLength();
      console.log('Pool Length:', poolLength.toString());

      const randomIndices = generateRandomIndices(poolLength, 12)
      const poolAddressPromises = randomIndices.map(i => masterChefContract.lpToken(i))
      const poolInfoPromises = randomIndices.map(i => masterChefContract.poolInfo(i))

      const lpTokenAddresses = await Promise.all(poolAddressPromises);
      const poolsData = await Promise.all(poolInfoPromises);
      const poolsDataWithID = poolsData.map((p, id) => ({
        id,
        data: p,
      }))

      const activePools = await Promise.all(poolsDataWithID
        .filter((pool) => {
          if (isActive) return pool.data.allocPoint !== 0n
          return pool.data.allocPoint === 0n
        }) // filter active pools only
        .map(async (pDataWithID) => {
          const { data: pool, id } = pDataWithID
          try {
            const lpAddress = lpTokenAddresses[id]
            const lpToken = new ethers.Contract(lpAddress, PancakePairABI, provider);
            const tokenName = await lpToken.name()
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
                rewardTokensPerBlock: (cakePerBlockRes * (pool.allocPoint / totalAllocPointRes)).toString(),
                percentage: ((pool.allocPoint / totalAllocPointRes)).toString(),
              };
            } else {
              return null
            }
          } catch (error) {
            console.error('Error fetching token data:', error);
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { pools, totalAllocPoint, cakePerBlock, isLoading, fetchData };
};

export default usePools;
