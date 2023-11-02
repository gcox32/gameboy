import React from 'react';
import { initPlayer } from '../utils/other/gui';
import { start } from '../utils/GameBoyIO';

function loadNewGame(filepath, callback) {
    var xhr = new XMLHttpRequest();
    const filename = filepath.split('/')[2];
    xhr.open("GET", filepath, true);
    xhr.responseType = 'blob';
    xhr.send();

    xhr.onreadystatechange = function () {
        if (this.status === 200) {
            const myBlob = new Blob([xhr.response]);
            const myFile = new File([myBlob], filename, {
                type: myBlob.type
            });
            callback(myBlob, myFile);
            return [myBlob, myFile]
        };
    };
    return [null, null]

}
function loadNewGameFunc(filepath) {
    var cartridge = loadNewGame(filepath, function (blob, file) {
        var reader = new FileReader();
        reader.addEventListener('load', function (e) {
            initPlayer();
            start(e.target.result);
        });
        reader.readAsBinaryString(file);
    });
};

function Cartridges({ onROMSelected }) {
    const handleROMChange = (e) => {
        const selectedROM = e.target.value;
        onROMSelected(selectedROM); // Inform the App component about the selected ROM
    };

    return (
        <select onChange={handleROMChange}>
            <option value="">--Select a ROM--</option>
            <option value="/carts/blue.gbc">True Blue</option>
            <option value="/carts/red.gbc">Red</option>
            <option value="/carts/green.gb">Green</option>
            <option value="/carts/yellow.gbc">Yellow</option>
        </select>
    );
}

export default Cartridges;
