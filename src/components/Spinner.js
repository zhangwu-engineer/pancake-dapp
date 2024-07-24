const Spinner = ({ size = 16, text }) => {
  return (
    <div className="flex justify-center items-center">
      <div className="animate-spin rounded-full border-t-4 border-blue-500" style={{ width: size, height: size }}></div>
      {text ? <p>{text}</p> : null}
    </div>
  );
};

export default Spinner;
