import React from 'react';

const PoolList = ({ pools }) => {
  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-4">Staking Pools</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pools.map((pool, index) => (
          <div key={index} className="bg-white shadow-md rounded-lg p-4 flex flex-col text-wrap">
            <h2 className="text-xl font-bold w-full">{pool.token0Symbol?.toString()} - {pool.token1Symbol?.toString()}</h2>
            <a className='text-blue-500 text-xs' href={`https://bscscan.com/address/${pool.lpToken}`} target="_blank" rel="noreferrer">{pool.lpToken}</a>
            <p>AllocPoint: {pool.allocPoint}</p>
            <p>Reward Tokens/Block: {pool.rewardTokensPerBlock}</p>
            <p>Percentage: {pool.percentage}%</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PoolList;
