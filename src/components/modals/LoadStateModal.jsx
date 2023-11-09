import React, { useState } from 'react';

function LoadStateModal({ isOpen, onClose, saveStates, onConfirm }) {

    if (!isOpen) return null;
    return (
        <div className="modal">
          <div onClick={onClose} className="modal-overlay"></div>
          <div className="modal-content">
            <button onClick={onClose} className="close-modal">&times;</button>
            <h2>Select a Save State</h2>
            <ul>
              {saveStates.map((saveState) => (
                <li key={saveState.id} onClick={() => onConfirm(saveState)}>
                  {saveState.title}
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
}

export default LoadStateModal;