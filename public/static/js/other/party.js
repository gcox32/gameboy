const moveBytes = [8, 9, 10, 11];
const currentPPBytes = [29, 30, 31, 32];

// document.onkeyup = function(e) {
//     e = e || window.event;
//     if (e.key === 'Escape') {
//         var modals = document.getElementsByClassName('modal');
//         for (let i=0; i<modals.length; i++) {
//             modals[i].style.display = 'none';
//         }
//     }
// };

class Move {
    constructor(idx, currentPP, moveslot) {
        this.idx = idx;
        this.currentPP = currentPP;
        this.moveslot = moveslot;
    }
    get details() {
        return blueMoveDict[this.idx];
    }
}
class Pokemon {
    constructor(idx, image, data) {
        this.idx = idx;
        this.image = image;
        this.data = data;
        this.movesList = [];
    }
    get name() {
        return dexDict[this.idx]['name'];
    }
    get pokedexNo() {
        return dexDict[this.idx]['pokedexNo'];
    }
    get active() {
        return data !== 0;
    }
    get type() {
        return [typeDict[this.data[5]], typeDict[this.data[6]]];
    }
    get status() {
        return statusDict[this.data[4]];
    }
    get moves() {
        for(let i=0; i < 4; i++){
            var move = new Move(
                this.data[moveBytes[i]], 
                this.data[currentPPBytes[i]],
                i+1
            )
            this.movesList.push(move);
        }
        return this.movesList;
    }
    get evs() {
        return {
            'HP':[this.data[17], this.data[18]],
            'ATK':[this.data[19], this.data[20]],
            'DEF':[this.data[21], this.data[22]],
            'SPD':[this.data[23], this.data[24]],
            'SPC':[this.data[25], this.data[26]]
        }
    }
    get ivs() {
        return [this.data[27], this.data[28]];
    }
    get lvl() {
        return this.data[33];
    }
    get stats() {
        return {
            'HP':this.data[35],
            'ATK':this.data[37],
            'DEF':this.data[39],
            'SPD':this.data[41],
            'SPC':this.data[43]
        }
    }
}

function getImgSrc(idx, style) {
	// var gifBase = 'https://projectpokemon.org/images/normal-sprite/bulbasaur.gif';
	// var greenBase = 'https://projectpokemon.org/images/sprites-models/gb-sprites/red-jp-001.png';
	// var blueBase = 'https://projectpokemon.org/images/sprites-models/gb-sprites/blue-jp-001.png';
	// var yellowBase = 'https://projectpokemon.org/images/sprites-models/gb-sprites/yellow-en-001.png';

	var nameNo = [dexDict[idx]['name'], dexDict[idx]['pokedexNo']];
	var link;
	switch (style) {
		case "gif": link = `https://projectpokemon.org/images/normal-sprite/${nameNo[0]}.gif`; break;
		case "green": link = `https://projectpokemon.org/images/sprites-models/gb-sprites/red-jp-${nameNo[1]}.png`; break;
		case "blue": link = `https://projectpokemon.org/images/sprites-models/gb-sprites/blue-jp-${nameNo[1]}.png`; break;
		case "red": link = `https://projectpokemon.org/images/sprites-models/gb-sprites/blue-jp-${nameNo[1]}.png`; break;
		case "yellow": link = `https://projectpokemon.org/images/sprites-models/gb-sprites/yellow-en-${nameNo[1]}.png`; break;
		default: link = 'break';
	}
	return link;
};
function getPartyInfo(fileOrBlob, style, game) {
	var bankIdx;
	var offset;
	switch(game) {
		case "yellow": offset = 355, bankIdx = 23; break;
		case "red": offset = 53604, bankIdx = 19; break;
		case "blue": offset = 53603, bankIdx = 19; break;
		default: offset = 0, bankIdx = 0;
	};
	var bank = fileOrBlob[bankIdx];

	// yellow offset, bank = 355, 23
	// blue and red offset, bank = 53604, 19
	// green info

	var partyIdxs = []
	for (var i=offset; i < offset + 6; i++) {
		if (bank[i] == 255) {
			break;
		} else {
			partyIdxs.push(bank[i]);
		}
	}

	var bankParty = bank.slice(offset+7, bank.length);
    var partyList = [];
	for (let i=0; i<partyIdxs.length; i++) {
        var pokemon = new Pokemon(
            idx=partyIdxs[i],
            image=getImgSrc(partyIdxs[i], style),
            data=bankParty.slice(44*i, 44*(i+1))
        )
        partyList.push(pokemon);
    }
    return partyList;
};
function updateParty(fileOrBlob, style, game, clear=true) {
	// get rom indices from save data
	var partyData = getPartyInfo(fileOrBlob, style, game);
	var partySlots = document.getElementsByClassName('party-slot');
	var partySlotImgs = document.getElementsByClassName('party-slot-img');
	var partySlotLvls = document.getElementsByClassName('lvl');

	if(clear){clearParty();};

	var style = document.createElement('style');
	style.id = 'party-slots-css'
	for (var i=0; i < 6; i++) {
		if (i < partyData.length) {
            var pokemon = partyData[i];
			partySlotImgs[i].style.display = 'block';
			partySlotImgs[i].src = pokemon.image;
			if (pokemon.active) {
				partySlotImgs[i].style.opacity = '1';
			} else {
				partySlotImgs[i].style.opacity = '0.2';
			};
			partySlotLvls[i].style.display = 'block';
			partySlotLvls[i].innerHTML = pokemon.lvl;
			var hoverCss =
                `.party-slot:nth-child(${i+2}) {
                    transition: all 100ms ease-in-out;
                }
                .party-slot:nth-child(${i+2}):hover {
                    cursor:pointer; 
                    box-shadow:0px 8px 16px rgb(0 0 0 / 60%);
                }
                .party-slot:nth-child(${i+2}):active {
                    transform: scale(0.95);
                }`
			style.appendChild(document.createTextNode(hoverCss));
            buildModal(i, pokemon);
			partySlots[i].addEventListener("click", toggleModal);
		} else {
			partySlotImgs[i].style.display = 'None';
			partySlotLvls[i].style.display = 'None';
			partySlots[i].removeEventListener('click', toggleModal)
		};
	};
	document.getElementsByTagName('head')[0].appendChild(style);
};
function clearParty() {
	var partySlotImgs = document.getElementsByClassName('party-slot-img');
	var partySlotLvls = document.getElementsByClassName('lvl');
	for (var i=0; i < 6; i++) {
		partySlotImgs[i].style.display = 'None';
		partySlotLvls[i].style.display = 'None';

	};
	
	var style = document.getElementById('party-slots-css');
	if (style) {
		style.remove();
	};
};
function attachModalListeners(modalElm, idx) {
	modalElm.querySelector(`button.close_modal#close-modal-${idx}`).addEventListener('click', toggleModal);
	modalElm.querySelector(`div.modal_overlay#modal-overlay-${idx}`).addEventListener('click', toggleModal);
};
function detachModalListeners(modalElm, idx) {
	modalElm.querySelector(`button.close_modal#close-modal-${idx}`).removeEventListener('click', toggleModal);
	modalElm.querySelector(`div.modal_overlay#modal-overlay-${idx}`).removeEventListener('click', toggleModal);
};
function toggleModal(event) {
    var idx = event.target.id.slice(-1);
	var modal = document.getElementById(`pokemon-modal-${idx}`);
	var currentState = modal.style.display;

	// If modal is hidden, display it. Else, hide it.
	if (currentState === 'none') {
		modal.style.display = 'block';
		attachModalListeners(modal, idx);
        intervalPaused = true;
		pause();
	} else {
		modal.style.display = 'none';
		detachModalListeners(modal, idx);  
        intervalPaused = false;
		run();
	}

};
function buildModal(idx, pokemon) {
    // title
    titleName = pokemon.name.toUpperCase().replace('.', ' ').replace('_M', ' &male;').replace('_F', '&female;');
    document.getElementById(`modal-title-${idx}`).innerHTML = titleName;

    // section 1: stats
    pokemonStats = pokemon.stats;
    document.getElementById(`stats-hp-${idx}`).innerText =  pokemonStats.HP;
    document.getElementById(`stats-atk-${idx}`).innerText = pokemonStats.ATK;
    document.getElementById(`stats-def-${idx}`).innerText = pokemonStats.DEF;
    document.getElementById(`stats-spd-${idx}`).innerText = pokemonStats.SPD;
    document.getElementById(`stats-spc-${idx}`).innerText = pokemonStats.SPC;
    document.getElementById(`stats-card-${idx}`).addEventListener("click", function() {
        this.classList.toggle("flipped");
    });

    stats = pokemon.stats;
    data = [stats.HP, stats.ATK, stats.DEF, stats.SPD, stats.SPC]
    spiderChart(idx, data);

    // section 2: image + type
    document.getElementById(`modal-img-${idx}`).src = pokemon.image;
    type=document.getElementById(`type-${idx}`);
    if(pokemon.type[0] == pokemon.type[1]){type.innerText=pokemon.type[0]}else{type.innerText=`${pokemon.type[0]}/${pokemon.type[1]}`};

    // section 3: EVs
    pokemonEVs = pokemon.evs;
    document.getElementById(`evs-hp-${idx}`).innerText =  pokemonEVs.HP[1];
    document.getElementById(`evs-atk-${idx}`).innerText = pokemonEVs.ATK[1];
    document.getElementById(`evs-def-${idx}`).innerText = pokemonEVs.DEF[1];
    document.getElementById(`evs-spd-${idx}`).innerText = pokemonEVs.SPD[1];
    document.getElementById(`evs-spc-${idx}`).innerText = pokemonEVs.SPC[1];
    document.getElementById(`evs-card-${idx}`).addEventListener("click", function() {
        this.classList.toggle("flipped");
    });

    // section 4: moveset
    pokemonMoves = pokemon.moves;
    for(let i=0; i<pokemonMoves.length; i++) {
        moveI = pokemonMoves[i];
        moveDetails = moveI.details;
        moveElm = document.getElementById(`modal-move-${i}-${idx}`);
        if(moveDetails.name!=='NULL'){
            moveType = moveDetails.type.toLowerCase().replace('_type','');
            moveTypeClass = `${moveType}-type`;

            moveSummaryId = `move-summary-${i}-${idx}`;
            moveSummary = document.getElementById(moveSummaryId);
            moveSummary.classList.add(moveTypeClass);
            // move summary components
            document.getElementById(`move-bp-${i}-${idx}`).innerText = `POWER: ${moveDetails.basepower}`;
            document.getElementById(`move-desc-${i}-${idx}`).innerText = `${moveDetails.description} (${moveDetails.type})`;
            document.getElementById(`move-acc-${i}-${idx}`).innerText = `ACC: ${moveDetails.accuracy}%`;

            moveElm.style.display = 'block';
            moveElm.innerText = moveDetails.name;
            moveElm.classList.add(moveTypeClass);
            moveElm.classList.remove('no-border-r');
            moveElm.setAttribute('data-hide', 'move-summary');
            moveElm.setAttribute('data-target', moveSummaryId);
            moveElm.addEventListener("click", toggleShow);
        } else {
            document.getElementById(`modal-move-${i-1}-${idx}`).classList.add('no-border-r');
            moveElm.style.display = 'none';
        }
    }
};

function spiderChart(idx, stats) {
    document.getElementById(`spider-chart-${idx}`).remove();
    let wrapper = document.getElementById(`stats-spider-${idx}`);
    let canvas = document.createElement('canvas');

    canvas.setAttribute('id',`spider-chart-${idx}`);
    wrapper.appendChild(canvas);

    data = {
        labels: ['HP','ATK','DEF','SPD','SPC'],
        datasets: [{
            label: '',
            data: stats,
            fill: true,
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgb(255, 99, 132)',
            pointBackgroundColor: 'rgb(255, 99, 132)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgb(255, 99, 132)'
        }]
    };
    const config = {
        type: 'radar',
        data: data,
        options: {
            plugins: {
                legend: {
                    display: false
                }
            },
            elements: {
                line: {
                    borderWidth: 2
                }
            }
        },
    };
    try {
        var chart = new Chart(canvas, config);
    } catch (err) {
        console.log(err);
    }
}

function toggleShow() {
    const hideClass = this.getAttribute('data-hide');
    const allElements = document.querySelectorAll(`.${hideClass}`);
    const target = this.getAttribute('data-target');

    allElements.forEach(elm => {
        if (elm.id == target) {
            elm.classList.toggle('show');
        } else {
            if (elm.classList.contains('show')) {
                elm.classList.remove('show');
            };
        };
    });
};