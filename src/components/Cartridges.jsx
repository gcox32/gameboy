import React, { useState, useEffect } from 'react';
import { API, graphqlOperation } from 'aws-amplify';
import { listGames } from '../graphql/queries';

function Cartridges({ onROMSelected, isDisabled, activeSaveState }) {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchGames = async () => {
            try {
                const gameData = await API.graphql(graphqlOperation(listGames));
                const gamesList = gameData.data.listGames.items;
                setGames(gamesList);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchGames();
    }, []);

    const handleROMChange = (e) => {
        const selectedValue = e.target.value;
        const selectedROM = games.find(game => game.filePath === selectedValue);
        // Pass the selected ROM object to the callback
        onROMSelected(selectedROM);
    };

    // Handling loading and error states in the component's return statement
    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <>
            <select onChange={handleROMChange} disabled={isDisabled} className="rom-selector">
                <option value="">--Select a Game--</option>
                {games.map(game => (
                    <option key={game.id} value={game.filePath}>
                        {game.title}
                    </option>
                ))}
            </select>
            <div id="active-game-title" className={activeSaveState ? "" : 'null'}>
                { activeSaveState ? activeSaveState.title : '' }
            </div>
        </>

    );
}

export default Cartridges;

