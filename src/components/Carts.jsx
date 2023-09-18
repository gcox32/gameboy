import React from "react";
import Cart from "./Cart";

function Carts(
) {
    const cartridges = [
        { id: 1, state: 'new', version: 'green', img: 'https://assets.letmedemo.com/gameboy/images/carts/green.png', fileLoc: '/' },
        { id: 2, state: 'new', version: 'red', img: 'https://assets.letmedemo.com/gameboy/images/carts/red.png', fileLoc: '/' },
        { id: 3, state: 'new', version: 'blue', img: 'https://assets.letmedemo.com/gameboy/images/carts/blue.png', fileLoc: '/carts/blue.gbc' },
        { id: 4, state: 'new', version: 'yellow', img: 'https://assets.letmedemo.com/gameboy/images/carts/yellow.png', fileLoc: '/' },
    ];
    return (
        <div className="drawer" id="carts" style={{ transform: 'translateX(0)' }} >
            {
                cartridges.map((c) => (
                    <Cart key={c.id} game={c} />
                ))
            }
        </div>
    )
}

export default Carts;