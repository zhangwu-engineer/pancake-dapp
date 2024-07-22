import PoolList from "./components/PoolList";
import usePools from "./hooks/usePools";

const App = () => {
  const { pools, isLoading } = usePools()

  return (
    <div className="App">
      <header className="bg-blue-500 text-white p-4">
        <h1 className="text-2xl">PancakeSwap Staking Pools</h1>
      </header>
      <main className="p-4">
        {
          isLoading ? <p>Loading Pools...</p> : <PoolList pools={pools} />
        }
      </main>
    </div>
  );
}

export default App;
