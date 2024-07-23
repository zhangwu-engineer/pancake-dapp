import PoolList from "./components/PoolList";
import Spinner from "./components/Spinner";
import usePools from "./hooks/usePools";

const App = () => {
  const { pools, isLoading, fetchData } = usePools()

  return (
    <div className="min-h-screen w-full">
      <header className="bg-blue-500 text-white p-4">
        <h1 className="text-2xl">PancakeSwap Staking Pools</h1>
      </header>
      <main className="p-4">
        <button
          onClick={fetchData}
          className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
          disabled={isLoading}
        >
          {isLoading ? 'Fetching Pools' : 'Fetch New'}
        </button>
        {isLoading ? <Spinner /> : <PoolList pools={pools} />}
      </main>
    </div>
  );
}

export default App;
