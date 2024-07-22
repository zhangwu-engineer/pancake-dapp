import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

import { masterChefContract, provider } from '../services/web3.services';
import { PancakePairABI } from '../abi/PancakePair';
import { erc20ABI } from '../abi/erc20';

const usePools = () => {
  const [pools, setPools] = useState([]);
  const [totalAllocPoint, setTotalAllocPoint] = useState(0);
  const [cakePerBlock, setCakePerBlock] = useState(0);
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const totalAllocPointRes = await masterChefContract.totalAllocPoint();
        console.log('Total Alloc Point:', totalAllocPointRes.toString());
        setTotalAllocPoint(totalAllocPointRes);
        const cakePerBlockRes = await masterChefContract.cakePerBlock();
        setCakePerBlock(cakePerBlockRes);
        console.log('Cake Per Block:', cakePerBlockRes.toString());
        const poolLength = await masterChefContract.poolLength();
        console.log('Pool Length:', poolLength.toString());

        const cake = await masterChefContract.cake();
        console.log('Cake:', cake);

        const poolPromises = [];
        for (let i = 0; i < poolLength; i++) {
          poolPromises.push(masterChefContract.poolInfo(i));
        }


        const poolsData = await Promise.all(poolPromises);

        const activePools = await Promise.all(poolsData
          .filter(pool => pool.allocPoint.toString() !== '1')
          .map(async (pool) => {
            try {
              const lpToken = new ethers.Contract(pool.lpToken, PancakePairABI, provider);
              const token0 = await lpToken.token0();
              const token1 = await lpToken.token1();
              const token0Contract = new ethers.Contract(token0, erc20ABI, provider);
              const token1Contract = new ethers.Contract(token1, erc20ABI, provider);
              const token0Symbol = await token0Contract.symbol();
              const token1Symbol = await token1Contract.symbol();
              // const rewardTokensPerBlock = cakePerBlock.mul(pool.allocPoint).div(totalAllocPoint);

              return {
                lpToken: pool.lpToken,
                allocPoint: pool.allocPoint.toString(),
                token0Symbol: token0Symbol || 'None',
                token1Symbol: token1Symbol || 'None',
                rewardTokensPerBlock: cakePerBlockRes.toString(),
                // percentage: (pool.allocPoint / totalAllocPoint) * 100,
                percentage: 23,
              };
            } catch (error) {
              // console.error('Error fetching token data:', error);
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
        // setTimeout(fetchData, 3000); // Retry after 3 seconds
      }
    };

    fetchData();
  }, []);

  return { pools, totalAllocPoint, cakePerBlock, isLoading };
};

export default usePools;
