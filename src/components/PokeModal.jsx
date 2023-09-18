import React from "react";

function PokeModal({ idx }) {
    return (
        <div className="modal" style={{display:'none'}} id={`pokemon-modal-${idx}`}>
            <div className="modal_overlay" id={`modal-overlay-${idx}`} name={`modal-overlay-${idx}`}></div>
            <div className="modal_content pb-0" id={`modal-content-${idx}`} style={{width:'auto'}}>
                <button title="close" className="close_modal" id={`close-modal-${idx}`} style={{right:0, top:0}}>
                    x
                </button>
                <div className="modal-title" id={`modal-title-${idx}`}></div>
                <div className="row">
                    <div id={`stats-card-${idx}`} className="stat-card">
                        <div className="col front" id={`stats-${idx}`}>
                            <div className="modal-section-title">STATS</div>
                            <div className="stat"><p className="pos-abs m-0">HP:</p><p id={`stats-hp-${idx}`} className="pos-abs right-0 m-0"></p></div>
                            <div className="stat"><p className="pos-abs m-0">ATTACK:</p><p id={`stats-atk-${idx}`} className="pos-abs right-0 m-0"></p></div>
                            <div className="stat"><p className="pos-abs m-0">DEFENSE:</p><p id={`stats-def-${idx}`} className="pos-abs right-0 m-0"></p></div>
                            <div className="stat"><p className="pos-abs m-0">SPEED:</p><p id={`stats-spd-${idx}`} className="pos-abs right-0 m-0"></p></div>
                            <div className="stat"><p className="pos-abs m-0">SPECIAL:</p><p id={`stats-spc-${idx}`} className="pos-abs right-0 m-0"></p></div>
                        </div>
                        <div className="back" id={`stats-spider-${idx}`}>
                            <canvas id={`spider-chart-${idx}`}></canvas>
                        </div>
                    </div>
                    <div className="col" style={{alignItems: 'center',justifyContent:'inherit'}}>
                        <img id={`modal-img-${idx}`} alt="" />
                        <p id={`type-${idx}`}></p>
                    </div>
                    <div id={`evs-card-${idx}`} className="stat-card">
                        <div className="col front" id={`evs-${idx}`}>
                            <div className="modal-section-title">EVS</div>
                            <div className="stat"><p className="pos-abs m-0">HP:</p><p className="pos-abs right-0 m-0" id={`evs-hp-${idx}`}></p></div>
                            <div className="stat"><p className="pos-abs m-0">ATTACK:</p><p className="pos-abs right-0 m-0" id={`evs-atk-${idx}`}></p></div>
                            <div className="stat"><p className="pos-abs m-0">DEFENSE:</p><p className="pos-abs right-0 m-0" id={`evs-def-${idx}`}></p></div>
                            <div className="stat"><p className="pos-abs m-0">SPEED:</p><p className="pos-abs right-0 m-0" id={`evs-spd-${idx}`}></p></div>
                            <div className="stat"><p className="pos-abs m-0">SPECIAL:</p><p className="pos-abs right-0 m-0" id={`evs-spc-${idx}`}></p></div>
                        </div>
                        <div className="back" id={`evs-bar-${idx}`}>
                            Bar chart
                        </div>
                    </div>
                </div>
                <div className="row" style={{paddingTop: '1em', minWidth: '500px', justifyContent:'space-evenly'}}>
                    <div className="moveslot" id={`modal-move-0-${idx}`}></div>
                    <div className="moveslot" id={`modal-move-1-${idx}`}></div>
                    <div className="moveslot" id={`modal-move-2-${idx}`}></div>
                    <div className="moveslot" id={`modal-move-3-${idx}`}></div>
                </div>
                <div className="row move-content">
                    <div className="move-summary" id={`move-summary-0-${idx}`}>
                        <div className="move-summary-component" id={`move-bp-0-${idx}`}></div>
                        <div className="move-summary-component" id={`move-desc-0-${idx}`}></div>
                        <div className="move-summary-component" id={`move-acc-0-${idx}`}></div>
                    </div>
                    <div className="move-summary" id={`move-summary-1-${idx}`}>
                        <div className="move-summary-component" id={`move-bp-1-${idx}`}></div>
                        <div className="move-summary-component" id={`move-desc-1-${idx}`}></div>
                        <div className="move-summary-component" id={`move-acc-1-${idx}`}></div>
                    </div>
                    <div className="move-summary" id={`move-summary-2-${idx}`}>
                        <div className="move-summary-component" id={`move-bp-2-${idx}`}></div>
                        <div className="move-summary-component" id={`move-desc-2-${idx}`}></div>
                        <div className="move-summary-component" id={`move-acc-2-${idx}`}></div>
                    </div>
                    <div className="move-summary" id={`move-summary-3-${idx}`}>
                        <div className="move-summary-component" id={`move-bp-3-${idx}`}></div>
                        <div className="move-summary-component" id={`move-desc-3-${idx}`}></div>
                        <div className="move-summary-component" id={`move-acc-3-${idx}`}></div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PokeModal;