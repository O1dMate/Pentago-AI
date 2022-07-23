let PIECES = {'EMPTY': -1, 'BLACK': 0, 'WHITE': 1};
let TURN = {
	PLAYER: 0,
	AI: 1,
	PLAYER_COLOR: PIECES.WHITE,
	AI_COLOR: PIECES.BLACK
};
let CURRENT_TURN = TURN.PLAYER;
let OTHER_PLAYER_LOOKUP = {[PIECES.WHITE]: PIECES.BLACK, [PIECES.BLACK]: PIECES.WHITE};

let currentlyHighlightedPieceIndex = -1;
let SEARCH_DEPTH = 3;

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

// Drawing functions to handled inverted Y-Axis of the browser
const drawRect = (x, y, w, h, curve) => rect(x, SCREEN_HEIGHT-y, w, h, curve);
const drawLine = (x1, y1, x2, y2) => line(x1, SCREEN_HEIGHT-y1, x2, SCREEN_HEIGHT-y2);
const drawCircle = (x, y, d) => circle(x, SCREEN_HEIGHT-y, d);
const drawArc = (x, y, w, h, startAngle, stopAngle) => arc(x, SCREEN_HEIGHT-y, w, h, 2*Math.PI-stopAngle, 2*Math.PI-startAngle);
const drawTri = (x1, y1, x2, y2, x3, y3) => triangle(x1, SCREEN_HEIGHT-y1, x2, SCREEN_HEIGHT-y2, x3, SCREEN_HEIGHT-y3);

function StartConfiguration() {
	GamePieces = [];

	// Default Game Board is empty
	for (let i = 0; i < 36; ++i) {
		GamePieces.push(PIECES.EMPTY);
	}

	// GamePieces[1] = PIECES.WHITE;
	// GamePieces[2] = PIECES.WHITE;
	// GamePieces[3] = PIECES.WHITE;
	// GamePieces[7] = PIECES.BLACK;
	// GamePieces[8] = PIECES.BLACK;
	// GamePieces[9] = PIECES.BLACK;

	// GamePieces[0] = PIECES.BLACK;
	// GamePieces[10] = PIECES.BLACK;
	// GamePieces[15] = PIECES.BLACK;
	// GamePieces[25] = PIECES.BLACK;
	// GamePieces[34] = PIECES.BLACK;
	// GamePieces[1] = PIECES.WHITE;
	// GamePieces[6] = PIECES.WHITE;
	// GamePieces[29] = PIECES.WHITE;
	// GamePieces[35] = PIECES.WHITE;

	// GamePieces[4] = PIECES.BLACK;
	// GamePieces[9] = PIECES.BLACK;
	// GamePieces[14] = PIECES.BLACK;
	// GamePieces[19] = PIECES.BLACK;
	// GamePieces[24] = PIECES.BLACK;
	
	// GamePieces[3] = PIECES.BLACK;
	// GamePieces[5] = PIECES.BLACK;
	// GamePieces[14] = PIECES.BLACK;
	// GamePieces[15] = PIECES.BLACK;
	// GamePieces[17] = PIECES.BLACK;
	// GamePieces[10] = PIECES.WHITE;
	// GamePieces[18] = PIECES.WHITE;
	// GamePieces[25] = PIECES.WHITE;
	// GamePieces[30] = PIECES.WHITE;
	// GamePieces[32] = PIECES.WHITE;

	// GamePieces = '-1,-1,-1,-1,1,0,0,1,1,0,1,1,-1,1,0,0,0,-1,0,1,1,1,1,0,1,-1,0,-1,0,1,-1,0,-1,-1,-1,-1'.split(',').map(x => parseInt(x));
	GamePieces = '-1,-1,-1,-1,1,0,0,1,1,0,1,1,-1,-1,0,0,0,-1,0,1,1,0,1,-1,1,-1,0,1,0,-1,-1,0,-1,1,-1,-1'.split(',').map(x => parseInt(x));
}

function IsForcedMoveForPlayer(game, move, targetColor) {
	game[move[0]] = OTHER_PLAYER_LOOKUP[targetColor];
	RotateBoard(game, move[1], move[2]);

	let result = _IsForcedMoveForPlayer(game, targetColor);

	RotateBoard(game, move[1], !move[2]);
	game[move[0]] = -1;

	return result;
}

function _IsForcedMoveForPlayer(game, targetColor) {
	// Check for 3 in a single row (NOT only in a row), with open ends, and no opponent pieces
	// The other player must block prevent 4 in a row with an open end or they will lose.
	if (_ForcedMoveAuxOne(game, targetColor)) return true;

	// Check for 4 in a single row (NOT only in a row), with an empty spot in the middle that will make 5 in a row.
	// This check all detects 4 in a row with either an open end or both open ends.
	// The other player must block this empty spot or they will lose.
	if (_ForcedMoveAuxTwo(game, targetColor)) return true;

	return false;
}

function _ForcedMoveAuxOne(game, targetColor) {
	for (let i = 0; i < ROW_INDICES.length; ++i) {
		if (_ForcedMoveCheckThreeInARowOpenEndNoOpponent(game, ROW_INDICES[i], targetColor)) return true;
	}

	for (let i = 0; i < COL_INDICES.length; ++i) {
		if (_ForcedMoveCheckThreeInARowOpenEndNoOpponent(game, COL_INDICES[i], targetColor)) return true;
	}

	for (let i = 0; i < DIAGONAL_INDICES.length; ++i) {
		if (_ForcedMoveCheckThreeInARowOpenEndNoOpponent(game, DIAGONAL_INDICES[i], targetColor)) return true;
	}

	return false;
}

function _ForcedMoveAuxTwo(game, targetColor) {
	for (let i = 0; i < ROW_INDICES.length; ++i) {
		if (_ForcedMoveCheckFourInARowAboutToBeFive(game, ROW_INDICES[i], targetColor)) return true;
	}

	for (let i = 0; i < COL_INDICES.length; ++i) {
		if (_ForcedMoveCheckFourInARowAboutToBeFive(game, COL_INDICES[i], targetColor)) return true;
	}

	for (let i = 0; i < DIAGONAL_INDICES.length; ++i) {
		if (_ForcedMoveCheckFourInARowAboutToBeFive(game, DIAGONAL_INDICES[i], targetColor)) return true;
	}

	return false;
}

// Check for 3 in a single row (NOT only in a row), with open ends, and no opponent pieces
// The other player must block prevent 4 in a row with an open end or they will lose.
function _ForcedMoveCheckThreeInARowOpenEndNoOpponent(game, rowColDiagIndexList, targetColor) {
	// If the row is only length 5, this isn't a concern. Even if the three in a row have open ends, adding an extra one will remove the open end. Only rows of size 6 can lead to 4 in a row with open ends.
	if (rowColDiagIndexList.length === 5) return false;

	// If the two ends aren't empty, then this won't lead to 4 in a row with open ends.
	if (game[rowColDiagIndexList[0]] !== PIECES.EMPTY) return false;
	if (game[rowColDiagIndexList[5]] !== PIECES.EMPTY) return false;

	let numberOfEmpties = 0;

	for (let i = 1; i < rowColDiagIndexList.length-1; ++i) {
		if (game[rowColDiagIndexList[i]] === targetColor) return false;

		if (game[rowColDiagIndexList[i]] === PIECES.EMPTY) numberOfEmpties++;

		if (numberOfEmpties > 1) return false;
	}

	return true;
}

function _ForcedMoveCheckFourInARowAboutToBeFive(game, rowColDiagIndexList, targetColor) {
	let emptyCount = 0;
	let targetColorCount = 0;

	if (rowColDiagIndexList.length === 6) {
		for (let i = 0; i < rowColDiagIndexList.length-1; ++i) {
			if (game[rowColDiagIndexList[i]] === targetColor) break;
			else if (game[rowColDiagIndexList[i]] === PIECES.EMPTY) emptyCount++;
			else targetColorCount++;
		}

		if (emptyCount === 1 && targetColorCount === 4) return true;

		emptyCount = 0;
		targetColorCount = 0;

		for (let i = 1; i < rowColDiagIndexList.length; ++i) {
			if (game[rowColDiagIndexList[i]] === targetColor) break;
			else if (game[rowColDiagIndexList[i]] === PIECES.EMPTY) emptyCount++;
			else targetColorCount++;
		}

		if (emptyCount === 1 && targetColorCount === 4) return true;
	} else {
		for (let i = 0; i < rowColDiagIndexList.length; ++i) {
			if (game[rowColDiagIndexList[i]] === targetColor) return false;
			else if (game[rowColDiagIndexList[i]] === PIECES.EMPTY) emptyCount++;
			else targetColorCount++;
		}

		if (emptyCount === 1 && targetColorCount === 4) return true;
	}


	return false;
}

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

	StartConfiguration();
	frameRate(5);

	console.log(IsForcedMoveForPlayer(GamePieces, PIECES.WHITE), IsForcedMoveForPlayer(GamePieces, PIECES.BLACK)); 
}

let gameHistory = [];
let searchCalls = 0n;
let computeAiMove = false;
let gameOver = false;

// To be called each frame
function draw() {
	// if (frameCount > 1) return;
	if (gameOver) {
		let whiteStrength = EvaluateStrength(GamePieces, PIECES.WHITE);
		let blackStrength = EvaluateStrength(GamePieces, PIECES.BLACK);

		if (whiteStrength > blackStrength && whiteStrength === Number.MAX_SAFE_INTEGER) console.log('WHITE WINS!!!');
		else if (blackStrength > whiteStrength && blackStrength === Number.MAX_SAFE_INTEGER) console.log('BLACK WINS!!!');
		else console.log('DRAW!!!');
	}

	// Draw background & set Rectangle draw mode
	background(30);
	rectMode(CENTER);

	// Draw Game Board
	DrawBoard();

	if (frameCount > 1 && !gameOver && computeAiMove) {
		// If the board is empty, choose a random starting move.
		if (GamePieces.filter(x => x === PIECES.EMPTY).length === GamePieces.length) {
			let randomStartChoice = Math.floor(Math.random()*GamePieces.length);
			GamePieces[randomStartChoice] = TURN.AI_COLOR;
		} else {
			let result = SearchAux(GamePieces, TURN.AI_COLOR);
			gameHistory.push(GamePieces.toString());
			GamePieces[result[0]] = TURN.AI_COLOR;
			RotateBoard(GamePieces, result[1], result[2]);
		}

		CURRENT_TURN = TURN.PLAYER;
		computeAiMove = false;

		if (Math.abs(EvaluateStrength(GamePieces, TURN.AI_COLOR)) === Number.MAX_SAFE_INTEGER) {
			gameOver = true;
		}
	}
	// else if (frameCount > 1 && !gameOver) {
	// 	let result = SearchAux(GamePieces, TURN.PLAYER_COLOR);
	// 	gameHistory.push(GamePieces.toString());
	// 	GamePieces[result[0]] = TURN.PLAYER_COLOR;
	// 	RotateBoard(GamePieces, result[1], result[2]);
	// 	CURRENT_TURN = TURN.AI;

	// 	if (Math.abs(Evaluate(GamePieces, TURN.AI_COLOR)) === Number.MAX_SAFE_INTEGER) {
	// 		gameOver = true;
	// 	}
	// }

	if (GamePieces.filter(x => x === PIECES.EMPTY).length === 0) gameOver = true;

	if (!gameOver && CURRENT_TURN === TURN.AI) computeAiMove = true;
}

let playerQuadrantSelection = 0;
let playerRotationDirection = false;

function AITakePlayerTurn() {
	SearchAux(GamePieces, TURN.PLAYER_COLOR);
}

function undo() {
	if (gameHistory.length <= 0) return;
	gameHistory.pop();
	let newState = gameHistory.pop();

	GamePieces = newState.split(',').map(x => parseInt(x));
	CURRENT_TURN = TURN.PLAYER;
	gameOver = false;
}

function mousePressed() {
	if (currentlyHighlightedPieceIndex !== -1 && CURRENT_TURN === TURN.PLAYER && !gameOver) {
		gameHistory.push(GamePieces.toString());
		
		GamePieces[currentlyHighlightedPieceIndex] = TURN.PLAYER_COLOR;
		RotateBoard(GamePieces, playerQuadrantSelection, playerRotationDirection);

		console.log('Score After Player Move:', EvaluateStrength(GamePieces, TURN.PLAYER_COLOR));

		if (Math.abs(EvaluateStrength(GamePieces, TURN.PLAYER_COLOR)) === Number.MAX_SAFE_INTEGER) {
			gameOver = true;
		}

		CURRENT_TURN = TURN.AI;
	}
}

function keyPressed() {
	if (key === '1') playerQuadrantSelection = 0;
	else if (key === '2') playerQuadrantSelection = 1;
	else if (key === '3') playerQuadrantSelection = 2;
	else if (key === '4') playerQuadrantSelection = 3;

	if (key === 'l' || key === 'L' || key === 'ArrowLeft') playerRotationDirection = false;
	else if (key === 'r' || key === 'R' || key === 'ArrowRight') playerRotationDirection = true;
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

	textAlign(CENTER, CENTER);
	fill(0,150,0);
	textSize(30);
	text(PrettyResult([0, playerQuadrantSelection, playerRotationDirection]).slice(1,3).join(','), SCREEN_WIDTH/2, SCREEN_HEIGHT/2);

	let pieceSelected = null;

	// Draw Pieces on the Game Boards
	GamePieces.forEach((piece, index) => {
		let targetBoard = boardLocations[GamePieceIndexToPieceLocationMap[index].board];
		let pieceLocation = targetBoard.pieceLocations[GamePieceIndexToPieceLocationMap[index].index];

		if (piece === PIECES.EMPTY) {
			if (CURRENT_TURN === TURN.PLAYER && Math.sqrt((mouseX-pieceLocation.x)**2 + ((SCREEN_HEIGHT-mouseY)-pieceLocation.y)**2) < pieceSize/2) {
				fill(0, 120, 0);
				pieceSelected = index;
			} else {
				fill(120, 0, 0);
			}
		}
		else if (piece === PIECES.BLACK) fill(0, 0, 0);
		else fill(220, 220, 220);

		drawCircle(pieceLocation.x, pieceLocation.y, pieceSize);

		if (piece === PIECES.EMPTY) {
			textAlign(CENTER, CENTER);
			fill(0,20,180);
			textSize(32);
			text(index.toString(), pieceLocation.x, SCREEN_HEIGHT-pieceLocation.y);
		}

	});

	if (pieceSelected !== null) currentlyHighlightedPieceIndex = pieceSelected;
	else currentlyHighlightedPieceIndex = -1;
}

function PrettyResult(result) {
	let niceResults = result.map(x => x);
	niceResults[1] = 	niceResults[1] === 0 ? 'Q1' :
					niceResults[1] === 1 ? 'Q2' :
					niceResults[1] === 2 ? 'Q3' :
					'Q4';
	niceResults[2] = niceResults[2] === false ? 'Left' : 'Right';
	return niceResults;
}