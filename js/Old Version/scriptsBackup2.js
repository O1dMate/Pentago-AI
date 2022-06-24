let pairScore = 2; // Score for having two in a row
let tripletScore = 6; // Score for having three in a row
let quadScore = 10; // Score for having four in a row

let openEndPair = 3; // Score for two in a row, but with an open end.
let openEndTriplet = 12; // Score for three in a row, but with an open end.
let openEndQuad = 20; // Score for four in a row, but with an open end.

let PIECES = {'EMPTY': -1, 'BLACK': 0, 'WHITE': 1};

let SCREEN_WIDTH = 0;
let SCREEN_HEIGHT = 0;

let fullBoardSize;
let gapBetweenBoards;
let singleBoardSize;
let boardRadiusCurve = 15;
let pieceSize;
let gapBetweenPieces;

// Screen Locations of the 4 Game Boards
let boardLocations = {
	'TL': { x: 0, y: 0, pieceLocations: [] },
	'TR': { x: 0, y: 0, pieceLocations: [] },
	'BL': { x: 0, y: 0, pieceLocations: [] },
	'BR': { x: 0, y: 0, pieceLocations: [] },
};

// Track what piece is in location (empty=-1, black=0, white=1).
let GamePieces = [];
let GamePieceIndexToPieceLocationMap = {
	0: {board: 'TL', index: 0},
	1: {board: 'TL', index: 1},
	2: {board: 'TL', index: 2},

	3: {board: 'TR', index: 0},
	4: {board: 'TR', index: 1},
	5: {board: 'TR', index: 2},

	6: {board: 'TL', index: 3},
	7: {board: 'TL', index: 4},
	8: {board: 'TL', index: 5},

	9: {board: 'TR', index: 3},
	10: {board: 'TR', index: 4},
	11: {board: 'TR', index: 5},

	12: {board: 'TL', index: 6},
	13: {board: 'TL', index: 7},
	14: {board: 'TL', index: 8},

	15: {board: 'TR', index: 6},
	16: {board: 'TR', index: 7},
	17: {board: 'TR', index: 8},

	18: {board: 'BL', index: 0},
	19: {board: 'BL', index: 1},
	20: {board: 'BL', index: 2},

	21: {board: 'BR', index: 0},
	22: {board: 'BR', index: 1},
	23: {board: 'BR', index: 2},

	24: {board: 'BL', index: 3},
	25: {board: 'BL', index: 4},
	26: {board: 'BL', index: 5},

	27: {board: 'BR', index: 3},
	28: {board: 'BR', index: 4},
	29: {board: 'BR', index: 5},

	30: {board: 'BL', index: 6},
	31: {board: 'BL', index: 7},
	32: {board: 'BL', index: 8},

	33: {board: 'BR', index: 6},
	34: {board: 'BR', index: 7},
	35: {board: 'BR', index: 8},
};

const ROW_INDICES = [[0,1,2,3,4,5],[6,7,8,9,10,11],[12,13,14,15,16,17],[18,19,20,21,22,23],[24,25,26,27,28,29],[30,31,32,33,34,35]];
const COL_INDICES = [[0,6,12,18,24,30],[1,7,13,19,25,31],[2,8,14,20,26,32],[3,9,15,21,27,33],[4,10,16,22,28,34],[5,11,17,23,29,35]];
const DIAGONAL_INDICES = [[6,13,20,27,34],[0,7,14,21,28,35],[1,8,15,22,29],[24,19,14,9,4],[30,25,20,15,10,5],[31,26,21,16,11]];

// Drawing functions to handled inverted Y-Axis of the browser
const drawRect = (x, y, w, h, curve) => rect(x, SCREEN_HEIGHT-y, w, h, curve);
const drawLine = (x1, y1, x2, y2) => line(x1, SCREEN_HEIGHT-y1, x2, SCREEN_HEIGHT-y2);
const drawCircle = (x, y, d) => circle(x, SCREEN_HEIGHT-y, d);
const drawArc = (x, y, w, h, startAngle, stopAngle) => arc(x, SCREEN_HEIGHT-y, w, h, 2*Math.PI-stopAngle, 2*Math.PI-startAngle);
const drawTri = (x1, y1, x2, y2, x3, y3) => triangle(x1, SCREEN_HEIGHT-y1, x2, SCREEN_HEIGHT-y2, x3, SCREEN_HEIGHT-y3);

// Initial Setup
function setup() {
	SCREEN_WIDTH = window.innerWidth - 20;
	SCREEN_HEIGHT = window.innerHeight - 20

	createCanvas(window.innerWidth-20, window.innerHeight-20);

	fullBoardSize = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT);
	gapBetweenBoards = fullBoardSize/20;
	singleBoardSize = (fullBoardSize - gapBetweenBoards) / 2;
	pieceSize = singleBoardSize / 6;
	gapBetweenPieces = singleBoardSize/3;

	// Calculate the screen locations of the 4 game boards
	boardLocations.TL.x = SCREEN_WIDTH/2 - singleBoardSize/2 - gapBetweenBoards/4;
	boardLocations.TL.y = SCREEN_HEIGHT/2 + singleBoardSize/2 + gapBetweenBoards/4;

	boardLocations.TR.x = SCREEN_WIDTH/2 + singleBoardSize/2 + gapBetweenBoards/4;
	boardLocations.TR.y = SCREEN_HEIGHT/2 + singleBoardSize/2 + gapBetweenBoards/4;

	boardLocations.BL.x = SCREEN_WIDTH/2 - singleBoardSize/2 - gapBetweenBoards/4;
	boardLocations.BL.y = SCREEN_HEIGHT/2 - singleBoardSize/2 - gapBetweenBoards/4;

	boardLocations.BR.x = SCREEN_WIDTH/2 + singleBoardSize/2 + gapBetweenBoards/4;
	boardLocations.BR.y = SCREEN_HEIGHT/2 - singleBoardSize/2 - gapBetweenBoards/4;

	// Calculate the screen locations where the pieces should be drawn on the game boards.

	Object.values(boardLocations).forEach(board => {
		board.pieceLocations.push({ x: board.x - gapBetweenPieces, y: board.y + gapBetweenPieces});
		board.pieceLocations.push({ x: board.x, y: board.y + gapBetweenPieces});
		board.pieceLocations.push({ x: board.x + gapBetweenPieces, y: board.y + gapBetweenPieces});

		board.pieceLocations.push({ x: board.x - gapBetweenPieces, y: board.y});
		board.pieceLocations.push({ x: board.x, y: board.y});
		board.pieceLocations.push({ x: board.x + gapBetweenPieces, y: board.y});

		board.pieceLocations.push({ x: board.x - gapBetweenPieces, y: board.y - gapBetweenPieces});
		board.pieceLocations.push({ x: board.x, y: board.y - gapBetweenPieces});
		board.pieceLocations.push({ x: board.x + gapBetweenPieces, y: board.y - gapBetweenPieces});
	});

	// Default Game Board is empty
	for (let i = 0; i < 36; ++i) {
		// GamePieces.push(Math.floor(Math.random()*3)-1); // Testing Only, change to -1 after
		// GamePieces.push(PIECES.EMPTY);

		if (i < 24) GamePieces.push(PIECES.EMPTY);
	}

	GamePieces.push(PIECES.WHITE);
	GamePieces.push(PIECES.WHITE);
	GamePieces.push(PIECES.WHITE);
	GamePieces.push(PIECES.BLACK);
	GamePieces.push(PIECES.BLACK);
	GamePieces.push(PIECES.BLACK);
	GamePieces.push(PIECES.WHITE);
	GamePieces.push(PIECES.WHITE);
	GamePieces.push(PIECES.WHITE);
	GamePieces.push(PIECES.BLACK);
	GamePieces.push(PIECES.BLACK);
	GamePieces.push(PIECES.BLACK);

	GamePieces[0] = PIECES.WHITE;
	GamePieces[1] = PIECES.WHITE;
	GamePieces[2] = PIECES.WHITE;
	GamePieces[5] = PIECES.WHITE;
	GamePieces[10] = PIECES.BLACK;
	GamePieces[11] = PIECES.BLACK;
	// GamePieces[35] = PIECES.BLACK;

	// GamePieces[0] = PIECES.BLACK;
	// GamePieces[3] = PIECES.WHITE;

	// GamePieces[2] = PIECES.BLACK;
	// GamePieces[3] = PIECES.WHITE;

	// GamePieces[13] = PIECES.BLACK;
	// GamePieces[25] = PIECES.WHITE;

	// GamePieces[20] = PIECES.BLACK;
	// GamePieces[28] = PIECES.WHITE;
	// GamePieces[3] = PIECES.BLACK;
	// GamePieces[9] = PIECES.WHITE;
	// GamePieces = '0,-1,-1,0,1,-1,1,1,0,1,1,1,0,1,-1,1,0,-1,1,-1,0,1,-1,1,1,-1,0,1,0,1,0,-1,0,-1,1,1'.split(',').map(x => parseInt(x)).map(x => x === 1 ? 0 : (x === 0 ? 1 : -1));

	frameRate(30);
}

let searchCalls = 0;

// To be called each frame
function draw() {
	if (frameCount > 1) return;

	// Draw background & set Rectangle draw mode
	background(30);
	rectMode(CENTER);

	// Draw Game Board
	DrawBoard();

	searchCalls = 0;
	let a = Date.now();
	let result = Search(GamePieces, 2, PIECES.BLACK, PIECES.BLACK, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
	a = Date.now() - a;

	console.log('Current Score', Evaluate(GamePieces, PIECES.BLACK));
	console.log('Searchs:', searchCalls);
	console.log('Time Taken:', a);
	console.log('DONE - Best Move:', bestIndex, `score (${result})`);
	// let bestBlackMove = 0;
	// let bestBlackIndex = -1;

	// for (let i = 0; i < GamePieces.length; ++i) {
	// 	if (GamePieces[i] === PIECES.EMPTY) {
	// 		// Create a new game board with the suggested move
	// 		let GamePiecesWithMove = GamePieces.map(x => x);
	// 		GamePiecesWithMove[i] = PIECES.BLACK;

	// 		// let whiteStrength = EvaluateStrength(GamePiecesWithMove, PIECES.WHITE);
	// 		let aaaa = Evaluate(GamePiecesWithMove, PIECES.WHITE);
	// 		// let whiteStrength = EvaluateStrength(GamePiecesWithMove, PIECES.WHITE);
	// 		// let blackStrength = EvaluateStrength(GamePiecesWithMove, PIECES.BLACK);

	// 		console.log({i, aaaa});

	// 		if (aaaa === null) {
	// 			bestBlackMove = Number.MAX_SAFE_INTEGER;
	// 			bestBlackIndex = i;
	// 		}
	// 		else if (aaaa > bestBlackMove) {
	// 			bestBlackMove = aaaa;
	// 			bestBlackIndex = i;
	// 		}
	// 	}
	// }
	a = Date.now() - a;
	// console.log({bestBlackMove, bestBlackIndex, time: a});

	// Draw scene rectangle
	// fill(30,30,30);
	// stroke(255,255,255);
	// drawRect(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, SCREEN_WIDTH, SCREEN_HEIGHT)
}

function DrawBoard() {
	let fullBoardSize = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT);
	let gapBetweenBoards = fullBoardSize/20;
	let singleBoardSize = (fullBoardSize - gapBetweenBoards) / 2;

	noStroke();
	fill(255,30,30);

	fill(150,150,150);
	drawRect(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, fullBoardSize, fullBoardSize);

	fill(160,0,0);

	// Draw 4 Game Boards
	drawRect(boardLocations.TL.x, boardLocations.TL.y, singleBoardSize, singleBoardSize, boardRadiusCurve);
	drawRect(boardLocations.TR.x, boardLocations.TR.y, singleBoardSize, singleBoardSize, boardRadiusCurve);
	drawRect(boardLocations.BL.x, boardLocations.BL.y, singleBoardSize, singleBoardSize, boardRadiusCurve);
	drawRect(boardLocations.BR.x, boardLocations.BR.y, singleBoardSize, singleBoardSize, boardRadiusCurve);

	// Draw Pieces on the Game Boards
	GamePieces.forEach((piece, index) => {
		if (piece === PIECES.EMPTY) fill(120, 0, 0);
		else if (piece === PIECES.BLACK) fill(0, 0, 0);
		else fill(220, 220, 220);

		let targetBoard = boardLocations[GamePieceIndexToPieceLocationMap[index].board];
		let pieceLocation = targetBoard.pieceLocations[GamePieceIndexToPieceLocationMap[index].index];

		drawCircle(pieceLocation.x, pieceLocation.y, pieceSize);

		if (piece === PIECES.EMPTY) {
			textAlign(CENTER, CENTER);
			fill(0,20,180);
			textSize(32);
			text(index.toString(), pieceLocation.x, SCREEN_HEIGHT-pieceLocation.y);
		}
	});
}

let bestIndex = -1;

function Search(game, depth=2, targetColor, currentTurn, alpha, beta) {
	searchCalls++;
	if (depth <= 0) return Evaluate(game, targetColor);

	// console.log('game', game);
	let listOfMoves = GetEmptyIndicies(game);

	if (depth === 2) listOfMoves = [3,4,9];
	// console.log('listOfMoves', listOfMoves);

	if (listOfMoves.length === 0) {
		console.log("NO MOVES!!!!");
		return 0;
	}

	let bestScore = Number.MIN_SAFE_INTEGER;

	// Loop over each possible move
	for (let i = 0; i < listOfMoves.length; ++i) {
		console.log("Searching:", currentTurn === PIECES.WHITE ? 'WHITE' : 'BLACK');
		
		let GamePiecesWithMove = game.map(x => x);
		GamePiecesWithMove[listOfMoves[i]] = currentTurn;

		let nextTurn = currentTurn === PIECES.BLACK ? PIECES.WHITE : PIECES.BLACK;
		let evaluationOfMove = Search(GamePiecesWithMove, depth-1, targetColor, nextTurn, -beta, -alpha);

		console.log('evaluationOfMove', evaluationOfMove, alpha, beta);

		if (evaluationOfMove >= beta) return beta;
		alpha = Math.max(evaluationOfMove, alpha);

		if (evaluationOfMove > bestScore) {
			bestScore = evaluationOfMove;
			bestIndex = listOfMoves[i];
		}
	}

	// console.log("Best Move:", bestIndex, `score (${bestScore})`)

	return bestScore;
}

function GetEmptyIndicies(game) {
	let emptyIndexList = [];

	for (let i = 0; i < game.length; ++i) {
		if (game[i] === PIECES.EMPTY) {
			emptyIndexList.push(i);
			// emptyIndexList.push(i);
			// emptyIndexList.push(i);
			// emptyIndexList.push(i);
		}
	}

	return emptyIndexList;
}

function Evaluate(game, targetColor) {
	let whiteStrength = EvaluateStrength(game, PIECES.WHITE);
	let blackStrength = EvaluateStrength(game, PIECES.BLACK);

	// console.log({whiteStrength, blackStrength});

	if (targetColor === PIECES.WHITE) return whiteStrength - blackStrength;
	else return blackStrength - whiteStrength;
}

function EvaluateStrength(game, targetColor) {
	let score = 0;
	let tempScore;

	for (let i = 0; i < ROW_INDICES.length; ++i) {
		tempScore = CountRowColDiagScore(ROW_INDICES[i].map(index => game[index]), targetColor);

		if (tempScore === Number.MAX_SAFE_INTEGER) return Number.MAX_SAFE_INTEGER;
		score += tempScore;
	}

	for (let i = 0; i < COL_INDICES.length; ++i) {
		tempScore = CountRowColDiagScore(COL_INDICES[i].map(index => game[index]), targetColor);

		if (tempScore === Number.MAX_SAFE_INTEGER) return Number.MAX_SAFE_INTEGER;
		score += tempScore;
	}

	for (let i = 0; i < DIAGONAL_INDICES.length; ++i) {
		tempScore = CountRowColDiagScore(DIAGONAL_INDICES[i].map(index => game[index]), targetColor);

		if (tempScore === Number.MAX_SAFE_INTEGER) return Number.MAX_SAFE_INTEGER;
		score += tempScore;
	}

	return score;
}

function CountRowColDiagScore(rowCol, targetColor) {
	let score = 0;
	let openStart = false;
	let openEnd = false;
	let consecutive = 0;

	for (let i = 0; i < rowCol.length; ++i) {
		if (rowCol[i] === targetColor) {
			consecutive++;
		} else {
			if (rowCol[i] === PIECES.EMPTY) openEnd = true;
			else openEnd = false;

			if (consecutive >= 2) {
				score = ScoreConsecutive(score, consecutive, openStart, openEnd);
			}

			consecutive = 0;
			openEnd = false;

			if (rowCol[i] === PIECES.EMPTY) openStart = true;
			else openStart = false;
		}
	}

	if (consecutive >= 2) {
		score = ScoreConsecutive(score, consecutive, openStart, openEnd);
	}

	return score;
}

function ScoreConsecutive(currentScore, consecutive, openStart, openEnd) {
	if (consecutive === 2) return currentScore + (openStart || openEnd) ? openEndPair : pairScore;
	else if (consecutive === 3) return currentScore + (openStart || openEnd) ? openEndTriplet : tripletScore;
	else if (consecutive === 4) return currentScore + (openStart || openEnd) ? openEndQuad : quadScore;
	return Number.MAX_SAFE_INTEGER;
}