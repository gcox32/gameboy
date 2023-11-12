import React from "react";

function OptionButton({ onClick, confirm }) {
  return (
    <>
      <button onClick={onClick} className={`option-button desktop`}>
          {confirm ? 'Confirm' : 'Cancel'}
      </button>
      <button onClick={onClick} className={`option-button mobile`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            {!confirm && <path d="M18 6L6 18M6 6l12 12" />}
            {confirm && <path d="M20 6L9 17l-5-5" />}
          </svg>
      </button>
    </>
  );
}


export default OptionButton;