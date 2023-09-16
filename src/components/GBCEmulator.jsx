import React from "react";

function Console() {
    return (
        <div class="console-container" id="console">
            <div id="GameBoy" class="window">
                <div id="gfx">
                    <canvas id="mainCanvas"></canvas>
                </div>
            </div>

            <div class="switch-wrapper" style={{display:'none'}}>
                <label class="switch" for="checkbox">
                    <input type="checkbox" id="checkbox" />
                    <div class="slider round" title="play mode"></div>
                </label>
            </div>

            <div id="on-light"></div>
            <div class="gb-btn a-b" id="a-btn"></div>
            <div class="gb-btn a-b" id="b-btn"></div>
            <div class="gb-btn joypad" id="up-btn"></div>
            <div class="gb-btn joypad" id="down-btn"></div>
            <div class="gb-btn joypad" id="left-btn"></div>
            <div class="gb-btn joypad" id="right-btn"></div>
            <div class="gb-btn st-sel" id="start-btn"></div>
            <div class="gb-btn st-sel" id="select-btn"></div>
            <div id="fullscreenContainer">
                <canvas id="fullscreen" class="maximum"></canvas>
            </div>
        </div>
    )
}

export default Console;