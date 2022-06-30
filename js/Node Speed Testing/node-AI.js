const standardAi = require('./AI_Standard');
const alphaBetaOnlyAi = require('./AI_Standard_Alpha_Beta');
const abMoveOrderingAi = require('./AI_Standard_AB_Move_Ordering');
const abMoIterativeDeepeningAi = require('./AI_Standard_AB_MO_Iterative_Deepening');
const abMoIdTranspositionLookupAi = require('./AI_Standard_AB_MO_ID_Transposition_Lookup');

let PIECES = { 'EMPTY': -1, 'BLACK': 0, 'WHITE': 1 };
// let OTHER_PLAYER_LOOKUP = { [PIECES.WHITE]: PIECES.BLACK, [PIECES.BLACK]: PIECES.WHITE };

// ******************** UPDATABLE OPTIONS ********************
let TURN = {
	PLAYER: 0,
	AI: 1,
	PLAYER_COLOR: PIECES.WHITE,
	AI_COLOR: PIECES.BLACK,
};

let SEARCH_DEPTH = 5;
// ******************** UPDATABLE OPTIONS ********************

let pairScore = 2; // Score for having two in a row
let tripletScore = 100; // Score for having three in a row
let quadScore = 20; // Score for having four in a row

let openEndPair = 8; // Score for two in a row, but with an open end.
let openEndTriplet = 20; // Score for three in a row, but with an open end.
let openEndQuad = 80; // Score for four in a row, but with an open end.

const SCORES = {pairScore,tripletScore,quadScore,openEndPair,openEndTriplet,openEndQuad};

// Track what piece is in location
let GamePieces = [];

function StartConfiguration() {
	GamePieces = [];

	// Default Game Board is empty
	for (let i = 0; i < 36; ++i) {
		GamePieces.push(PIECES.EMPTY);
	}

	// GamePieces = '-1,-1,-1,-1,1,0,0,1,1,0,1,1,-1,1,0,0,0,-1,0,1,1,1,1,0,1,-1,0,-1,0,1,-1,0,-1,-1,-1,-1'.split(',').map(x => parseInt(x));

	// GamePieces = '-1,-1,-1,-1,1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1'.split(',').map(x => parseInt(x));

	GamePieces = '-1,-1,-1,-1,1,0,0,1,1,0,1,1,-1,1,0,0,0,-1,0,1,1,1,1,0,1,-1,0,-1,0,1,-1,0,-1,-1,-1,-1'.split(',').map(x => parseInt(x));
	/* AI as White
		Depth (1), Score (282) [ 17, 'Q2', 'Right' ] Calls (105) msTime (3)
		Depth (2), Score (-86) [ 12, 'Q1', 'Left' ] Calls (1521) msTime (19)
		AI Winning Move: [ 1, 'Q1', 'Left' ]
	*/
	/* AI as Black
		Depth (1), Score (9007199254740962) [ 12, 'Q1', 'Left' ] Calls (105) msTime (4)
		Depth (2), Score (-134) [ 3, 'Q3', 'Right' ] Calls (1103) msTime (17)
		Depth (3), Score (242) [ 34, 'Q4', 'Right' ] Calls (33204) msTime (74)
		Depth (4), Score (-192) [ 1, 'Q3', 'Right' ] Calls (114709) msTime (322)
	*/
}

// To be called each frame
function draw() {
	console.log('\nMinimax AI (α+β pruning + MO + ID + Transposition Lookup 10M)');
	abMoIdTranspositionLookupAi(GamePieces.toString(), SEARCH_DEPTH, TURN.AI_COLOR, PIECES, SCORES);

	console.log('\nMinimax AI (α+β pruning + MO + Iterative Deepening)');
	abMoIterativeDeepeningAi(GamePieces.toString(), SEARCH_DEPTH, TURN.AI_COLOR, PIECES, SCORES);
	
	console.log('\nMinimax AI (α+β pruning + Move Ordering)');
	abMoveOrderingAi(GamePieces.toString(), SEARCH_DEPTH, TURN.AI_COLOR, PIECES, SCORES);
	
	console.log('\nMinimax AI (α+β pruning)');
	alphaBetaOnlyAi(GamePieces.toString(), SEARCH_DEPTH, TURN.AI_COLOR, PIECES, SCORES);

	console.log(`\nStandard Minimax AI (no optimizations)`);
	standardAi(GamePieces.toString(), SEARCH_DEPTH, TURN.AI_COLOR, PIECES, SCORES);
}

StartConfiguration();
draw();