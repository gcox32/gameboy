import React from "react";

function Console() {
    return (
        <div className="console-container" id="console">
            <div className="hidden-info" id="active-cart" value=""></div>
            <div id="GameBoy" className="window">
                <div id="gfx">
                    <canvas id="mainCanvas"></canvas>
                </div>
            </div>

            <div className="switch-wrapper" style={{display:'none'}}>
                <label className="switch" htmlFor="checkbox">
                    <input type="checkbox" id="checkbox" />
                    <div className="slider round" title="play mode"></div>
                </label>
            </div>

            <div id="on-light"></div>
            <div className="gb-btn a-b" id="a-btn"></div>
            <div className="gb-btn a-b" id="b-btn"></div>
            <div className="gb-btn joypad" id="up-btn"></div>
            <div className="gb-btn joypad" id="down-btn"></div>
            <div className="gb-btn joypad" id="left-btn"></div>
            <div className="gb-btn joypad" id="right-btn"></div>
            <div className="gb-btn st-sel" id="start-btn"></div>
            <div className="gb-btn st-sel" id="select-btn"></div>
            <div id="fullscreenContainer">
                <canvas id="fullscreen" className="maximum"></canvas>
            </div>
        </div>
    )
}

export default Console;