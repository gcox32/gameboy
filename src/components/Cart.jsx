import React from "react";

function Cart({ game }) {
    return (
        <div className="cartridge" id={ game.version } value={ game.state } name={ game.fileLoc }>
            <img src={ game.img } height="170px" alt="" />
        </div>
    )
}

export default Cart;