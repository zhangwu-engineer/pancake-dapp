import { useEffect, useState } from "react"
import Spinner from "./Spinner";

const BLOCKS_PER_YEAR = 10512000; // Assuming 3 seconds per block

const PoolCard = ({ pool, prices }) => {
  const {
    lpToken,
    allocPoint,
    token0,
    token1,
    token0Symbol,
    token1Symbol,
    rewardPerBlock,
    cakePrice,
    percentage,
    totalSupply,
    reserve0,
    reserve1
  } = pool
  const [tvl, setTvl] = useState(0)
  const [apr, setApr] = useState(0)
  console.log(prices, token0, token1)

  useEffect(() => {
    const token0Price = prices[token0.toString().toLowerCase()]?.usd || 0
    const token1Price = prices[token1.toString().toLowerCase()]?.usd || 0
    if (token0Price && token1Price) {
      setTvl((((reserve0 * token0Price) + (reserve1 * token1Price)) / totalSupply).toFixed(2) || 0);
    }

  }, [prices, reserve0, reserve1, token0, token1, totalSupply])

  useEffect(() => {
    const rewardPerBlockValue = rewardPerBlock * cakePrice;
    if (tvl) {
      setApr(((rewardPerBlockValue * BLOCKS_PER_YEAR * 100) / tvl).toFixed(2) || 0);
    }
  }, [cakePrice, rewardPerBlock, tvl])

  return (
    <div className="bg-white shadow-md rounded-lg p-4 flex flex-col text-wrap">
      <h2 className="text-xl font-bold w-full">
        {token0Symbol?.toString()} - {token1Symbol?.toString()}
      </h2>
      <a
        className="text-blue-500 text-xs"
        href={`https://bscscan.com/address/${lpToken}`}
        target="_blank"
        rel="noreferrer"
      >
        {lpToken}
      </a>
      <p>AllocPoint: {allocPoint}</p>
      <p>Reward Tokens/Block: {rewardPerBlock}</p>
      <p>Percentage: {percentage}%</p>
      <div className="flex items-center justify-between w-1/2">TVL: {tvl ? `$${tvl}` : <Spinner />}</div>
      <div className="flex items-center justify-between w-1/2">APR: {apr ? `${apr}%` : <Spinner />}</div>
    </div>
  )
}

export default PoolCard

