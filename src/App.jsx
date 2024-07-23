import { useCallback, useState } from "react";
import PoolList from "./components/PoolList";
import Spinner from "./components/Spinner";
import usePools from "./hooks/usePools";

const App = () => {
  const [showActive, setShowActive] = useState(true)
  const { pools, isLoading, fetchData } = usePools()

  const togglePools = useCallback(() => {
    setShowActive(!showActive)
    fetchData(!showActive)
  }, [fetchData, showActive]);

  return (
    <div className="App">
      <header className="bg-blue-500 text-white p-4">
        <h1 className="text-2xl">PancakeSwap Staking Pools</h1>
      </header>
      <main className="p-4">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => fetchData(showActive)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
            disabled={isLoading}
          >
            {isLoading ? 'Fetching' : 'Fetch New'}
          </button>
          <button
            onClick={togglePools}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            {showActive ? 'Show Inactive Pools' : 'Show Active Pools'}
          </button>
        </div>
        {isLoading ? (
          <Spinner />
        ) : (
          <PoolList pools={pools} />
        )}
      </main>
    </div>
  );
}

export default App;
