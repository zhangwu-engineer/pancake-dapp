const Toggle = ({ checked, onChange, disabled }) => (
  <label
    className={`inline-flex items-center ' ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <input
      type="checkbox"
      checked={checked}
      className="sr-only peer"
      disabled={disabled}
      onChange={onChange}
    />
    <div className="relative w-9 h-5 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-action"></div>
    <div className="ms-3 flex flex-col gap-1">
      <span className="text-xs font-medium text-black">
        Showing {checked ? 'Active' : 'InActive'} Pools
      </span>
    </div>
  </label>
)

export default Toggle
