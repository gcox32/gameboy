import React from "react";

function Settings() {
    return (
        <div className="drawer" id="settings">
            <div className="btn gray-border" id="saver" value="blue" title="save file">save game</div>
            <div className="btn gray-border" id="pause-btn" title="pause game">pause</div>
            <div className="btn gray-border" id="resume-btn" title="resume game">resume</div>
            <div className="btn gray-border" id="reset-btn" title="start from last save">reset</div>
            <div className="btn gray-border" id="newgame-btn" title="start new game">new game</div>
            <div className="btn gray-border" id="enable-sound" title="disable sound" value="true">sound on</div>
            <div className="game-setting" id="game-speed">
                <label>Adjust Speed</label>
                <div className="input-row">
                    <input type="number" id="speed-input" defaultValue="1.0" step="0.1" min="0" disabled />
                </div>
            </div>
        </div>
    )
}

export default Settings;