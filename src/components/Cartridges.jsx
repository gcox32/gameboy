import React from 'react';

const romOptions = [
  { value: "true_blue.gbc", background: "blue.png", label: "True Blue" },
  { value: "blue.gbc", background: "blue.png", label: "Pokemon Blue" },
  { value: "red.gbc", background: "red.png", label: "Pokemon Red" },
  { value: "green.gb", background: "green.png", label: "Pocket Monsters Green" },
  { value: "yellow.gbc", background: "yellow.png", label: "Pokemon Yellow" },
  { value: "super_mario_deluxe.gbc", background: "", label: "Super Mario"}
];

function Cartridges({ onROMSelected, isDisabled }) {
    const handleROMChange = (e) => {
        const selectedValue = e.target.value;
        const selectedROM = romOptions.find(option => option.value === selectedValue);
        // Pass the selected ROM object to the callback
        onROMSelected(selectedROM); 
    };

    return (
        <select onChange={handleROMChange} disabled={isDisabled}>
            <option value="">--Select a ROM--</option>
            {romOptions.map(option => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
}

export default Cartridges;

