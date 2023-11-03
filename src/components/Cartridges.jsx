import React from 'react';

function Cartridges({ onROMSelected, isDisabled }) {
    const handleROMChange = (e) => {
        const selectedROM = e.target.value;
        onROMSelected(selectedROM); // Inform the App component about the selected ROM
    };

    return (
        <select onChange={handleROMChange} disabled={isDisabled}>
            <option value="">--Select a ROM--</option>
            <option data-background="blue.png" value="/carts/blue.gbc">True Blue</option>
            <option data-background="red.png" value="/carts/red.gbc">Red</option>
            <option data-background="green.png" value="/carts/green.gb">Green</option>
            <option data-background="yellow.png" value="/carts/yellow.gbc">Yellow</option>
        </select>
    );
}

export default Cartridges;
