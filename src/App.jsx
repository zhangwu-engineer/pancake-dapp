import { useCallback, useEffect, useState } from "react";
import PoolList from "./components/PoolList";
import Spinner from "./components/Spinner";
import usePools from "./hooks/usePools";
import { fetchTokenPrices } from "./utils/helpers";
import Toggle from "./components/Toggle";

const App = () => {
  const [showActive, setShowActive] = useState(false)
  const [prices, setPrices] = useState({})
  const [isLoadingPrices, setIsLoadingPrices] = useState(false)
  const [isInitialLoadingPrices, setIsInitialLoadingPrices] = useState(true)

  const { pools, isLoading, fetchData, cakeAddrs, failedCount } = usePools(showActive)

  const [failedAddrs, setFailedAddrs] = useState([])

  const togglePools = useCallback(() => {
    setShowActive(!showActive)
    fetchData(!showActive)
  }, [fetchData, showActive]);

  // get token prices from Coingecko API
  const getTokenPrices = useCallback( async (addresses) => {
    setIsLoadingPrices(true)
    setFailedAddrs([])
    console.log('== started getting price')
    const { tokenPrices, failedAddrs } = await fetchTokenPrices(addresses)
    setPrices((prev) => ({
      ...prev,
      ...tokenPrices
    }))
    setFailedAddrs(failedAddrs)
    console.log('== finished getting prices')
    
    setIsLoadingPrices(false)
  }, [])

  useEffect(() => {
    if (!isLoading && pools.length > 0 && !isLoadingPrices && cakeAddrs.length > 0 && isInitialLoadingPrices) {
      getTokenPrices(cakeAddrs)
      setIsInitialLoadingPrices(false)
    }
  }, [cakeAddrs, getTokenPrices, isInitialLoadingPrices, isLoading, isLoadingPrices, pools.length])
  
  // get token prices for failed cake token addresses
  useEffect(() => {
    if (!isLoading && pools.length > 0 && !isLoadingPrices && failedAddrs.length > 0 && !isInitialLoadingPrices) {
      getTokenPrices(failedAddrs)
    }
  }, [cakeAddrs, failedAddrs, getTokenPrices, isInitialLoadingPrices, isLoading, isLoadingPrices, pools.length])
  
  const getNewPools = useCallback(() => {
    fetchData(showActive)
    setPrices({})
    setIsInitialLoadingPrices(true)
    setFailedAddrs([])
  }, [showActive, fetchData])

  useEffect(() => {
    getNewPools()
  }, [getNewPools])

  return (
    <div className="App">
      <header className="bg-blue-500 text-white p-4">
        <h1 className="text-2xl">PancakeSwap Staking Pools</h1>
      </header>
      <main className="p-4">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={getNewPools}
            className="bg-blue-500 text-white px-4 py-2 rounded"
            disabled={isLoading}
          >
            {isLoading ? 'Fetching' : 'Fetch New'}
          </button>
          <Toggle checked={showActive} onChange={togglePools} disabled={isLoading} />
        </div>
        {isLoading ? (
          <Spinner size={64} />
        ) : (
          <PoolList pools={pools} prices={prices} />
        )}
        {
          failedCount < 4 && !isLoading && pools.length === 0 ? 
            <div className="fixed bottom-10 right-10">
              <Spinner size={40} text="Retrying" />
            </div> : null
        }
      </main>
    </div>
  );
}

export default App;
