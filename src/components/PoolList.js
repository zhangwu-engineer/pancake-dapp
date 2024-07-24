import React from 'react';
import PoolCard from './PoolCard';

const PoolList = ({ pools, prices }) => {
  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-4">Staking Pools</h1>
      {pools.length === 0 ? (
        <p className="text-center text-xl">We can't find any active pools at this time</p>
      ) : (
        <div>
          <p className="text-lg mb-4">We could get <b>{pools.length}</b> Pools</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pools.map((pool) => (
              <PoolCard pool={pool} prices={prices} key={pool.lpToken} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PoolList;
