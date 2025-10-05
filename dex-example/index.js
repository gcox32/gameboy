// import React from "react";
// import ReactDOM from "react-dom";
// import "./index.css";

const POKEMON = 1;

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function padStats(stat, val, sep, len) {
    val = val || "xx";
    let output = `
    ${stat.toString()}${sep.repeat(len - (val.toString().length + stat.toString().length))}${val.toString()}`;
    return output;
}

class Pokedex extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            requestRoot: "https://pokeapi.co/api/v2/pokemon/",
            pokemonIndex: POKEMON,
            pokemonData: {},
            pokemonDescription: "",
            speciesData: {},
            evoSprites: [],
            evoNames: [],
            moves: [],
            loading: false
        };
        this.nextPokemon = this.nextPokemon.bind(this);
        this.previousPokemon = this.previousPokemon.bind(this);
        this.pickPokemon = this.pickPokemon.bind(this);
    }

    nextPokemon() {
        const next = Math.min(this.state.pokemonIndex + 1, 949);
        this.setState({ pokemonIndex: next }, this.changePokemon);
    }

    previousPokemon() {
        const prev = Math.max(this.state.pokemonIndex - 1, 1);
        this.setState({ pokemonIndex: prev }, this.changePokemon);
    }

    pickPokemon(no) {
        this.setState({ pokemonIndex: no }, this.changePokemon);
    }

    componentDidMount() {
        this.changePokemon();
    }

    changePokemon() {
        this.setState({ loading: true });
        const request = `${this.state.requestRoot}${this.state.pokemonIndex}/`;
        fetch(request, {
            cache: "force-cache"
        })
            .then(response => response.json())
            .then(data => {
                this.setState({
                    pokemonData: data,
                    pokemonIndex: data.id
                });
                const speciesRequest = data.species.url;
                return fetch(speciesRequest);
            })
            .then(response => response.json())
            .then(data => {
                this.setState({
                    speciesData: data,

                    description: pickRandom(
                        data.flavor_text_entries.filter(e => e.language.name === "en").map(e => e.flavor_text)
                    ),

                    loading: false
                });
                const evo_chain = data.evolution_chain.url;
                fetch(evo_chain)
                    .then(response => response.json())
                    .then(data => {
                        const api = "https://pokeapi.co/api/v2/pokemon/";
                        const first = data.chain;
                        let second;
                        let third;
                        let evos = [];
                        if (first) {
                            const e1 = fetch(`${api}${first.species.name}/`);
                            evos.push(e1);
                            second = first.evolves_to[0];
                        }
                        if (second) {
                            const e2 = fetch(`${api}${second.species.name}/`);
                            third = second.evolves_to[0];

                            evos.push(e2);
                        }
                        if (third) {
                            const e3 = fetch(`${api}${third.species.name}/`);
                            evos.push(e3);
                        }
                        Promise.all(evos)
                            .then(responses => Promise.all(responses.map(value => value.json())))
                            .then(dataList => {
                                const sprites = dataList.map(v => v.sprites.front_default);
                                const names = dataList.map(n => n.name);
                                this.setState({ evoSprites: sprites, evoNames: names });
                            });
                    });
            });
    }

    render() {
        const pData = this.state.pokemonData;
        const sData = this.state.speciesData;

        return (
            <div className="pokedex">
                <LeftPanel
                    pData={pData}
                    sData={sData}
                    no={this.state.pokemonIndex}
                    description={this.state.description}
                />
                <
            
            />
                <RightPanel
                    pData={pData}
                    sData={sData}
                    evoSprites={this.state.evoSprites}
                    evoNames={this.state.evoNames}
                    controls={{ next: this.nextPokemon, prev: this.previousPokemon, pick: this.pickPokemon }}
                    no={this.state.pokemonIndex}
                />
                {/* <TypeList /> */}
            </div>
        );
    }
}

function LeftPanel(props) {
    const pData = props.pData;

    if (typeof pData === "object" && Object.keys(pData).length !== 0) {
        return (
            <div className="panel left-panel">
                <PokemonName name={pData.name} no={props.no} />
                <PokemonSprite src={pData.sprites} />
                <PokemonDescription description={props.description} no={props.no} />
            </div>
        );
    } else {
        return Loading();
    }
}

function PokemonName(props) {
    return (
        <div className="pokemon-name screen">
            {props.name}
            <span className="name-no">no. {props.no}</span>
        </div>
    );
}

class PokemonSprite extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            front: true,
            shiny: false,
            female: false
        };

        this.toggleGender = this.toggleGender.bind(this);
        this.toggleShiny = this.toggleShiny.bind(this);
        this.toggleFront = this.toggleFront.bind(this);
    }

    buildImage() {
        const dir = this.state.front ? "front" : "back";
        const gender = this.state.female ? "_female" : "";
        const shiny = this.state.shiny ? "_shiny" : "_default";
        // console.log(dir + shiny + gender);
        return dir + shiny + gender;
    }

    toggleGender() {
        // console.log("toggling gender");
        this.setState({ female: !this.state.female }, () => {
            if (this.props.src[this.buildImage()]) {
                return;
            } else {
                this.setState({ female: false });
            }
        });
    }

    toggleShiny() {
        // console.log("toggling shiny");
        this.setState({ shiny: !this.state.shiny }, () => {
            if (this.props.src[this.buildImage()]) {
                return;
            } else {
                this.setState({ shiny: false });
            }
        });
    }

    toggleFront() {
        // console.log("toggling front");
        this.setState({ front: !this.state.front }, () => {
            if (this.props.src[this.buildImage()]) {
                return;
            } else {
                this.setState({ front: false });
            }
        });
    }

    render() {
        const imgSrc = this.props.src[this.buildImage()] || this.props.src["front_default"];
        const funcs = { gender: this.toggleGender, front: this.toggleFront, shiny: this.toggleShiny };
        return (
            <div>
                <img src={imgSrc} alt="pokemon" className="pokemon-sprite" />
                <SpriteControls
                    funcs={funcs}
                    gender={this.state.female}
                    shiny={this.state.shiny}
                    front={this.state.front}
                />
            </div>
        );
    }
}

function SpriteControls(props) {
    return (
        <div className="sprite-controls">
            <div
                className={"sprite-control sprite-controls-gender " + (props.gender ? "sprite-control-selected" : "")}
                onClick={props.funcs.gender}
            >
                <i className="fas fa-venus" />
            </div>
            <div
                className={"sprite-control sprite-controls-shiny " + (props.shiny ? "sprite-control-selected" : "")}
                onClick={props.funcs.shiny}
            >
                <span>shiny</span>
            </div>
            <div
                className={"sprite-control sprite-controls-rotate " + (!props.front ? "sprite-control-selected" : "")}
                onClick={props.funcs.front}
            >
                <i className="fas fa-undo" />
            </div>
        </div>
    );
}

function PokemonDescription(props) {
    return <div className="pokemon-description screen">{props.description}</div>;
}

// class PokemonSpriteAnimated extends React.Component {
//     constructor(props) {
//         super(props);

//         const sprites = Object.keys(props.sprites)
//             .map(sprite => props.sprites[sprite])
//             .filter(url => url);

//         this.state = {
//             sprites: sprites,
//             index: 0
//         };
//     }

//     render() {
//         const index = this.state.index;
//         const sprites = this.state.sprites;
//         setTimeout(() => this.setState({ index: (index + 1) % sprites.length }), 1000);

//         return <PokemonSprite src={sprites[index]} />;
//     }
// }

function Divider(props) {
    return (
        <div className="divider">
            <div className="gap" />
            <div className="hinge" />
            <div className="gap" />
            <div className="hinge" />
            <div className="gap" />
            <div className="hinge" />
            <div className="gap" />
        </div>
    );
}

function RightPanel(props) {
    const types = props.pData.types;
    const stats = props.pData.stats;
    const moves = props.pData.moves;

    if (types) {
        return (
            <div className="panel right-panel">
                <div className="panel-row">
                    <PokemonStats stats={stats} />
                    <PokemonType types={types} />
                </div>

                <PokemonEvolution evoSprites={props.evoSprites} evoNames={props.evoNames} />
                <ButtonChrome />
                <MoveList moves={moves} />
                <PokedexControls controls={props.controls} no={props.no} />
            </div>
        );
    } else {
        return Loading();
    }
}

function PokemonStats(props) {
    const stats = props.stats;
    return (
        <div className="screen stats">
            {stats.map(s => {
                const name = s.stat.name;
                const value = s.base_stat;

                return <StatLine name={name} value={value} key={name} />;
            })}
        </div>
    );
}

function StatLine(props) {
    return (
        <div className="stat-line">
            {padStats(props.name, props.value, ".", 20)}
            {/* <span>{props.name}</span>
      {".".repeat(20 - props.name.length)}
      <span>{props.value}</span> */}
        </div>
    );
}

function PokemonType(props) {
    const types = props.types;
    return (
        <div className="type-list">
            <div className="panel-header">Types</div>
            <div className="type-box">
                {types.map(t => {
                    const type = t.type.name;
                    return <Type type={type} key={type} />;
                })}
            </div>
            {/* <div className="panel-header">Evolutions</div> */}
        </div>
    );
}

function PokemonEvolution(props) {
    const e1 = props.evoSprites[0];
    const e2 = props.evoSprites[1];
    const e3 = props.evoSprites[2];
    const n1 = props.evoNames[0];
    const n2 = props.evoNames[1];
    const n3 = props.evoNames[2];

    return (
        <div className="panel-row panel-evo">
            {/* <div className="panel-header evo-header">Evolutions</div> */}
            <PokemonSpriteSmall src={e1} evo="I" name={n1} />
            <PokemonSpriteSmall src={e2} evo="II" name={n2} />
            <PokemonSpriteSmall src={e3} evo="III" name={n3} />
        </div>
    );
}

function PokemonSpriteSmall(props) {
    let evoImage;

    if (props.src) {
        evoImage = <img src={props.src} alt="pokemon" className="pokemon-sprite pokemon-sprite-small" />;
    } else {
        evoImage = <PokeBall />;
    }

    return (
        <div>
            <div className="flex-center">
                <div className="evo-num">{props.evo}</div>
            </div>
            {evoImage}
            <div className="screen evo-name">{props.name || "No Data"}</div>
        </div>
    );
}

function PokeBall(props) {
    return (
        <div className="pokemon-sprite pokemon-sprite-small empty-evo">
            <div className="poke-ball">
                <div className="poke-ball-top" />
                <div className="poke-ball-center">
                    <div className="poke-ball-dot" />
                </div>
                <div className="poke-ball-bottom" />
            </div>
        </div>
    );
}

function ButtonChrome(props) {
    return (
        <div className="panel-row blue-buttons">
            <div className="blue-button" />
            <div className="blue-button" />
            <div className="blue-button" />
            <div className="blue-button" />
            <div className="blue-button" />
            <div className="blue-button" />
            <div className="blue-button" />
            <div className="blue-button" />
            <div className="blue-button" />
            <div className="blue-button" />
        </div>
    );
}
class MoveList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            index: 0,
            currentMove: {},
            loading: false
        };
        this.nextMove = this.nextMove.bind(this);
        this.prevMove = this.prevMove.bind(this);
    }

    componentDidMount() {
        // console.log(this.props.moves[0].move.name);
        this.loadMoves();
    }

    loadMoves() {
        this.setState({ loading: true, index: this.state.index }, () => {
            fetch(this.props.moves[this.state.index].move.url)
                .then(response => response.json())
                .then(data => {
                    this.setState({ currentMove: data, loading: false });
                });
        });
    }

    componentDidUpdate(prevProps) {
        // Typical usage (don't forget to compare props):
        if (this.props.moves !== prevProps.moves) {
            this.setState({ index: 0 }, this.loadMoves);
        }
    }

    nextMove() {
        const nextIndex = Math.min(this.state.index + 1, this.props.moves.length - 1);
        this.setState({ index: nextIndex }, this.loadMoves);
    }

    prevMove() {
        const nextIndex = Math.max(this.state.index - 1, 0);
        this.setState({ index: nextIndex }, this.loadMoves);
    }

    render() {
        let moves;
        // let cur_move = this.props.moves[this.state.index];
        if (this.state.loading || Object.keys(this.state.currentMove).length === 0) {
            moves = <MovesLoading />;
        } else {
            const lvl = this.props.moves[this.state.index].version_group_details[0].level_learned_at;
            moves = <MoveEntry move={this.state.currentMove} lvl={lvl} />;
        }

        return (
            <div className="move-list">
                {moves}
                <div className="move-controls">
                    <div className="move-arrow" onClick={this.prevMove}>
                        <i className="fas fa-caret-up" />
                    </div>
                    <div className="move-arrow" onClick={this.nextMove}>
                        <i className="fas fa-caret-down" />
                    </div>
                </div>
            </div>
        );
    }
}

function MovesLoading() {
    return (
        <div className="move-body move-screen screen">
            <div className="move-left">
                <div className="move-name" style={{ textTransform: "none" }}>
                    xxxxx xxxxx
                </div>
                <div className="move-stat">{padStats("Accuracy", "xx", ".", 16)}</div>
                <div className="move-stat">{padStats("Power", "xx", ".", 16)}</div>
                <div className="move-stat">{padStats("PP", "xx", ".", 16)}</div>
            </div>
            <div className="move-right">
                <div className="move-type">Type: xxxxx</div>
                {/* <div className="move-status">Status Effect: {status}</div> */}
                <div className="move-learn">Learn: Lvl xx</div>
            </div>
        </div>
    );
}

function MoveEntry(props) {
    const move = props.move;
    const name = move.name || move.names.filter(m => m.language.name === "en")[0].name;
    const acc = move.accuracy;
    const pow = move.power;
    const pp = move.pp;
    const type = move.type.name;
    //   const status = "" || "---";˝
    const lvl = props.lvl;
    // console.log("move ", move);
    return (
        <div className="move-body move-screen screen">
            <div className="move-left">
                <div className="move-name">{name}</div>
                <div className="move-stat">{padStats("Accuracy", acc, ".", 16)}</div>
                <div className="move-stat">{padStats("Power", pow, ".", 16)}</div>
                <div className="move-stat">{padStats("PP", pp, ".", 16)}</div>
            </div>
            <div className="move-right">
                <div className="move-type">Type: {type}</div>
                {/* <div className="move-status">Status Effect: {status}</div> */}
                <div className="move-learn">Learn: Lvl {lvl}</div>
            </div>
        </div>
    );
}

function PokedexControls(props) {
    return (
        <div className="panel-row controls">
            <Button dir="left" onClick={props.controls.prev} />
            <NumInput no={props.no} func={props.controls.pick} />
            <Button dir="right" onClick={props.controls.next} />
        </div>
    );
}

function Button(props) {
    return <div className="button" onClick={props.onClick} />;
}

class NumInput extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            id: 1
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleClick = this.handleClick.bind(this);
    }

    handleChange(e) {
        e.preventDefault();
        this.setState({ id: e.target.value });
    }

    handleClick(e) {
        e.preventDefault();
        this.props.func(this.state.id);
    }

    render() {
        return (
            <div>
                <input
                    type="number"
                    className="screen num-input"
                    placeholder={this.props.no}
                    onChange={this.handleChange}
                />
                <div className="submit" onClick={this.handleClick} />
            </div>
        );
    }
}

function Loading() {
    return <h1>LOADING...</h1>;
}

function Type(props) {
    return <div className={"type " + props.type}>{props.type}</div>;
}

ReactDOM.render(<Pokedex />, document.getElementById("root"));

// class TypeList extends React.Component {
//     constructor(props) {
//         super(props);
//         this.state = {
//             loading: false,
//             data: []
//         };
//     }

//     componentDidMount() {
//         this.setState({ loading: true });

//         let request = "https://pokeapi.co/api/v2/type/";

//         fetch(request)
//             .then(response => response.json())
//             .then(data => this.setState({ data: data.results, loading: false }));
//     }

//     render() {
//         return (
//             <div className="type-list">
//                 {this.state.loading ? (
//                     <Loading />
//                 ) : (
//                     this.state.data.map(d => {
//                         return <Type type={d.name} key={d.name} />;
//                     })
//                 )}
//             </div>
//         );
//     }
// }
