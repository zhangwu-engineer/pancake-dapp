const Spinner = ({ size = 16 }) => {
  return (
    <div className="flex justify-center items-center">
      <div className="animate-spin rounded-full border-t-4 border-blue-500" style={{ width: size, height: size }}></div>
    </div>
  );
};

export default Spinner;
