let pairScore = 2; // Score for having two in a row
let tripletScore = 100; // Score for having three in a row
let quadScore = 20; // Score for having four in a row

let openEndPair = 8; // Score for two in a row, but with an open end.
let openEndTriplet = 20; // Score for three in a row, but with an open end.
let openEndQuad = 80; // Score for four in a row, but with an open end.

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
let SEARCH_DEPTH = 4;

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
const DIAGONAL_INDICES_FROM_INDEX = [];
const SURROUNDING_INDICES = [];

for (let i = 0; i < 36; ++i) {
	let currentArray = [];
	DIAGONAL_INDICES.forEach((diagIndices, index) => {
		diagIndices.forEach(diagIndex => {
			if (i === diagIndex) currentArray.push(index);
		})
	});
	DIAGONAL_INDICES_FROM_INDEX.push(currentArray);
}
for (let i = 0; i < 36; ++i) {
	let currentArray = [];

	let isOnEdge = {
		'N': (i >= 0 && i <= 5),
		'S': (i >= 30 && i <= 35),
		'E': (i%6 === 5),
		'W': (i%6 === 0),
	};
	
	// General Case
	if (!isOnEdge.N && !isOnEdge.S && !isOnEdge.E && !isOnEdge.W) {
		currentArray.push(i-7); currentArray.push(i-6); currentArray.push(i-5);
		currentArray.push(i-1);	currentArray.push(i+1);
		currentArray.push(i+5); currentArray.push(i+6); currentArray.push(i+7);
	}
	// 4 Corners
	else if (isOnEdge.N && isOnEdge.W) {
		currentArray.push(i+1);
		currentArray.push(i+6); currentArray.push(i+7);
	} else if (isOnEdge.N && isOnEdge.E) {
		currentArray.push(i-1);
		currentArray.push(i+5); currentArray.push(i+6);
	} else if (isOnEdge.S && isOnEdge.W) {
		currentArray.push(i-6); currentArray.push(i-5);
		currentArray.push(i+1);
	} else if (isOnEdge.S && isOnEdge.E) {
		currentArray.push(i-7); currentArray.push(i-6);
		currentArray.push(i-1);
	}
	// Edges, but not corners
	else if (isOnEdge.N) {
		currentArray.push(i-1);	currentArray.push(i+1);
		currentArray.push(i+5); currentArray.push(i+6); currentArray.push(i+7);
	} else if (isOnEdge.S) {
		currentArray.push(i-7); currentArray.push(i-6); currentArray.push(i-5);
		currentArray.push(i-1);	currentArray.push(i+1);
	} else if (isOnEdge.E) {
		currentArray.push(i-7); currentArray.push(i-6);
		currentArray.push(i-1);
		currentArray.push(i+5); currentArray.push(i+6);
	} else if (isOnEdge.W) {
		currentArray.push(i-6); currentArray.push(i-5);
		currentArray.push(i+1);
		currentArray.push(i+6); currentArray.push(i+7);
	}

	SURROUNDING_INDICES.push(currentArray);
}

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

	// GamePieces = '-1,-1,-1,-1,1,0,0,1,1,0,1,1,-1,-1,0,0,0,-1,0,1,1,0,1,-1,1,-1,0,1,0,-1,-1,0,-1,1,-1,-1'.split(',').map(x => parseInt(x));
	// GamePieces = '0,0,0,0,-1,-1,1,1,-1,0,1,-1,1,-1,-1,0,1,-1,1,0,1,-1,-1,-1,-1,-1,-1,-1,-1,-1,0,1,-1,-1,-1,-1'.split(',').map(x => parseInt(x));

	// let blackPieces = 3;
	// let whitePieces = 3;

	// while (blackPieces > 0) {
	// 	let i = Math.floor(Math.random()*GamePieces.length);
		
	// 	while (GamePieces[i] !== PIECES.EMPTY) {
	// 		i = Math.floor(Math.random()*GamePieces.length);
	// 	}

	// 	GamePieces[i] = PIECES.BLACK;
	// 	blackPieces--;
	// }

	// while (whitePieces > 0) {
	// 	let i = Math.floor(Math.random()*GamePieces.length);
		
	// 	while (GamePieces[i] !== PIECES.EMPTY) {
	// 		i = Math.floor(Math.random()*GamePieces.length);
	// 	}

	// 	GamePieces[i] = PIECES.WHITE;
	// 	whitePieces--;
	// }
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

	// GamePieces[4] = PIECES.BLACK;
	// GamePieces[5] = PIECES.WHITE;
	// GamePieces[11] = PIECES.WHITE;

	// GamePieces[12] = PIECES.BLACK;
	// GamePieces[13] = PIECES.BLACK;
	// GamePieces[14] = PIECES.BLACK;
	// GamePieces[15] = PIECES.BLACK;
	// GamePieces[16] = PIECES.WHITE;
	// GamePieces[17] = PIECES.BLACK;

	// GamePieces[19] = PIECES.WHITE;
	// GamePieces[20] = PIECES.WHITE;
	// GamePieces[21] = PIECES.WHITE;
	// GamePieces[22] = PIECES.BLACK;

	// GamePieces[26] = PIECES.BLACK;
	// GamePieces[32] = PIECES.WHITE;

	// GamePieces = '-1,-1,-1,-1,1,0,0,1,1,0,1,1,-1,-1,0,0,0,-1,-1,1,-1,0,1,-1,1,-1,0,1,0,-1,-1,0,-1,1,-1,-1'.split(',').map(x => parseInt(x));
	StartConfiguration();
	frameRate(5);
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

		// StartConfiguration();
		// gameOver = false;
		// CURRENT_TURN = Math.random() < 0.5 ? TURN.AI : TURN.PLAYER;
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

		console.log('score', EvaluateStrength(GamePieces, TURN.PLAYER_COLOR));
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

let originalDepth = 1;
let bestIndex = -1;
let iteriveDeepening = null;

function SearchAux(game, currentTurn) {
	let depth = 1;
	let depthTime = 0;
	searchCalls = 0n;

	// while (depth <= SEARCH_DEPTH) {
	while (true) {
		searchCalls = 0n;
		originalDepth = depth;

		depthTime = Date.now();
		result = Search(game, depth, currentTurn, currentTurn, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
		depthTime = Date.now() - depthTime;

		if (depth === 1 && result === Number.MIN_SAFE_INTEGER) {
			console.log('AI LOST!!!');
			break;
		}

		if (result === Number.MAX_SAFE_INTEGER) {
			console.log("AI Winning Move:", PrettyResult(bestIndex));
			break;
		}


		iteriveDeepening = bestIndex[0];
		console.log(`Depth (${depth}), Score (${result})`, PrettyResult(bestIndex), `Calls (${searchCalls})`, `msTime (${depthTime})`);
		depth++;

		if (depthTime > 500 || depth >= GamePieces.filter(x => x === PIECES.EMPTY).length) break; 
	}

	return bestIndex;
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

let evals = [];

function Search(game, depth, player, currentTurn, alpha, beta) {
	searchCalls += 1n;

	let currentGameScore = Evaluate(game, player);

	if (depth <= 0) return currentGameScore;
	if (currentGameScore === Number.MAX_SAFE_INTEGER || currentGameScore === Number.MIN_SAFE_INTEGER) return currentGameScore;

	let listOfMoves = GetEmptyIndicies(game, currentTurn);

	if (listOfMoves.length === 0) return currentGameScore;

	let nextTurn = currentTurn === PIECES.BLACK ? PIECES.WHITE : PIECES.BLACK;

	if (player === currentTurn) {
		let bestScore = Number.MIN_SAFE_INTEGER;

		for (let i = 0; i < listOfMoves.length; ++i) {
			// Modify the Game Board with the move
			GamePieces[listOfMoves[i][0]] = currentTurn;
			RotateBoard(GamePieces, listOfMoves[i][1], listOfMoves[i][2]);
			let evaluationOfMove = Search(GamePieces, depth-1, player, nextTurn, alpha, beta);

			// Undo the move from Game Board
			RotateBoard(GamePieces, listOfMoves[i][1], !listOfMoves[i][2]);
			GamePieces[listOfMoves[i][0]] = -1;

			if (depth === originalDepth && evaluationOfMove > bestScore) bestIndex = listOfMoves[i];
			bestScore = Math.max(bestScore, evaluationOfMove);

			if (bestScore >= beta) break;

			alpha = Math.max(alpha, bestScore);
		}

		return bestScore;
	} else {
		let bestScore = Number.MAX_SAFE_INTEGER;

		for (let i = 0; i < listOfMoves.length; ++i) {
			// Modify the Game Board with the move
			GamePieces[listOfMoves[i][0]] = currentTurn;
			RotateBoard(GamePieces, listOfMoves[i][1], listOfMoves[i][2]);

			let evaluationOfMove = Search(GamePieces, depth-1, player, nextTurn, alpha, beta);

			// Undo the move from Game Board
			RotateBoard(GamePieces, listOfMoves[i][1], !listOfMoves[i][2]);
			GamePieces[listOfMoves[i][0]] = -1;

			bestScore = Math.min(bestScore, evaluationOfMove); // Min here because we assume opponent chooses best possible move

			if (bestScore <= alpha) break;

			beta = Math.min(beta, bestScore);
		}

		return bestScore;
	}

	return bestScore;
}

function GetEmptyIndicies(game, targetColor) {
	let emptyIndexList = [];
	let quadrantsChoosen = 0;
	let indexScoreLookup = {};

	for (let i = 0; i < game.length; ++i) {
		if (game[i] === PIECES.EMPTY) {
			indexScoreLookup[i] = CountColorsOnRowColDiag(game, i, targetColor);

			if (!QuadrantSymmetricWithPiece(game, i, 0)) {
				emptyIndexList.push([i, 0, false]);
				emptyIndexList.push([i, 0, true]);
				++quadrantsChoosen;
			}

			if (!QuadrantSymmetricWithPiece(game, i, 1)) {
				emptyIndexList.push([i, 1, false]);
				emptyIndexList.push([i, 1, true]);
				++quadrantsChoosen;
			}

			if (!QuadrantSymmetricWithPiece(game, i, 2)) {
				emptyIndexList.push([i, 2, false]);
				emptyIndexList.push([i, 2, true]);
				++quadrantsChoosen;
			}

			if (!QuadrantSymmetricWithPiece(game, i, 3)) {
				emptyIndexList.push([i, 3, false]);
				emptyIndexList.push([i, 3, true]);
				++quadrantsChoosen;
			}

			if (quadrantsChoosen === 0) emptyIndexList.push([i, 0, false]);
		}
	}

	if (iteriveDeepening) {
		emptyIndexList.sort((a,b) => {
		 	if (a[0] !== iteriveDeepening && b[0] !== iteriveDeepening) return 0;
			return a[0] === iteriveDeepening ? -1 : b[0] === iteriveDeepening ? 1 : 0;
		});

		iteriveDeepening = null;
	} else {
		emptyIndexList.sort((a,b) => {
			return indexScoreLookup[a[0]] > indexScoreLookup[b[0]] ? -1 : 1;
		});
	}

	return emptyIndexList;
}


let QUADRANT_CENTER = {7: true, 10: true, 25: true, 28: true};
let QUADRANT_SYMMETRIC_INDICES = [0,1,2,6,7,8,12,13,14];
let QUADRANT_SYMMETRIC_PLUS_AMOUNTS = [0,3,18,21];

function QuadrantSymmetricWithPiece(game, index, quadrant) {
	let plusAmount = QUADRANT_SYMMETRIC_PLUS_AMOUNTS[quadrant];
	let tempIndex = 0;

	for (let i = 0; i < QUADRANT_SYMMETRIC_INDICES.length; ++i) {
		tempIndex = QUADRANT_SYMMETRIC_INDICES[i]+plusAmount;

		if (game[tempIndex] !== PIECES.EMPTY && !QUADRANT_CENTER[tempIndex]) return false;
		if (tempIndex === index && !QUADRANT_CENTER[tempIndex]) return false;
	}

	return true;
}

let QUADRANT_INDICES = [0,1,2,8,14,13,12,6];
let LEFT_TURN_ADD_AMOUNT = [2,7,12,5,-2,-7,-12,-5]; // Based on the QUADRANT_INDICES Array
let RIGHT_TURN_ADD_AMOUNT = [12,5,-2,-7,-12,-5,2,7]; // Based on the QUADRANT_INDICES Array
let QUADRANT_PLUS_AMOUNTS = [0,3,18,21];

// game = game board
// quadrant = 0,1,2,3 (TL, TR, BL, BR)
// direction = false,true (left, right)
function RotateBoard(game, quadrant, direction) {
	let plusAmount = QUADRANT_PLUS_AMOUNTS[quadrant];

	let oldLeftValues = [game[QUADRANT_INDICES[0]+plusAmount], game[QUADRANT_INDICES[1]+plusAmount]];
	let oldRightValues = [game[QUADRANT_INDICES[6]+plusAmount], game[QUADRANT_INDICES[7]+plusAmount]];

	if (!direction) {
		for (let i = 0; i < QUADRANT_INDICES.length; ++i) {
			if (i > 5) game[QUADRANT_INDICES[i]+plusAmount] = oldLeftValues[i-6];
			else game[QUADRANT_INDICES[i]+plusAmount] = game[QUADRANT_INDICES[i]+plusAmount+LEFT_TURN_ADD_AMOUNT[i]];
		}
	} else {
		for (let i = QUADRANT_INDICES.length-1; i > -1; --i) {
			if (i < 2) game[QUADRANT_INDICES[i]+plusAmount] = oldRightValues[i];
			else game[QUADRANT_INDICES[i]+plusAmount] = game[QUADRANT_INDICES[i]+plusAmount+RIGHT_TURN_ADD_AMOUNT[i]];
		}
	}
}


function Evaluate(game, targetColor) {
	let whiteStrength = EvaluateStrength(game, PIECES.WHITE);
	let blackStrength = EvaluateStrength(game, PIECES.BLACK);

	if (whiteStrength === blackStrength) return 0;
	else if (targetColor === PIECES.WHITE && whiteStrength === Number.MAX_SAFE_INTEGER) return Number.MAX_SAFE_INTEGER;
	else if (targetColor === PIECES.WHITE && blackStrength === Number.MAX_SAFE_INTEGER) return Number.MIN_SAFE_INTEGER;
	else if (targetColor === PIECES.BLACK && blackStrength === Number.MAX_SAFE_INTEGER) return Number.MAX_SAFE_INTEGER;
	else if (targetColor === PIECES.BLACK && whiteStrength === Number.MAX_SAFE_INTEGER) return Number.MIN_SAFE_INTEGER;
	else if (targetColor === PIECES.WHITE) return whiteStrength - blackStrength;
	return blackStrength - whiteStrength;
}

function EvaluateStrength(game, targetColor) {
	let score = 0;
	let tempScore;

	for (let i = 0; i < ROW_INDICES.length; ++i) {
		tempScore = CountRowColDiagScore(game, ROW_INDICES[i], targetColor);

		if (tempScore === Number.MAX_SAFE_INTEGER) return tempScore;
		score += tempScore;
	}

	for (let i = 0; i < COL_INDICES.length; ++i) {
		tempScore = CountRowColDiagScore(game, COL_INDICES[i], targetColor);

		if (tempScore === Number.MAX_SAFE_INTEGER) return tempScore;
		score += tempScore;
	}

	for (let i = 0; i < DIAGONAL_INDICES.length; ++i) {
		tempScore = CountRowColDiagScore(game, DIAGONAL_INDICES[i], targetColor);

		if (tempScore === Number.MAX_SAFE_INTEGER) return tempScore;
		score += tempScore;
	}

	return score;
}

function CountColorsOnRowColDiag(game, index, targetColor, print=false) {
	let rowIndices = ROW_INDICES[Math.floor(index/6)];
	let colIndices = COL_INDICES[index%6];
	let diagIndices = DIAGONAL_INDICES_FROM_INDEX[index];
	let nearbyIndices = SURROUNDING_INDICES[index];
	let count = 0;

	for (let i = 0; i < rowIndices.length; ++i) {
		if (game[rowIndices[i]] === targetColor) ++count;
	}

	for (let i = 0; i < colIndices.length; ++i) {
		if (game[colIndices[i]] === targetColor) ++count;
	}

	for (let i = 0; i < diagIndices.length; ++i) {
		for (let j = 0; j < DIAGONAL_INDICES[diagIndices[i]].length; ++j) {
			if (game[DIAGONAL_INDICES[diagIndices[i]][j]] === targetColor) ++count;
		}
	}

	for (let i = 0; i < nearbyIndices.length; ++i) {
		if (game[nearbyIndices[i]] === targetColor) ++count;
	}

	return count;
}

function CountRowColDiagScore(game, rowColDiagIndexList, targetColor) {
	let score = 0;
	let openStart = false;
	let openEnd = false;
	let consecutive = 0;

	for (let i = 0; i < rowColDiagIndexList.length; ++i) {
		if (game[rowColDiagIndexList[i]] === targetColor) {
			consecutive++;
		} else {
			if (game[rowColDiagIndexList[i]] === PIECES.EMPTY) openEnd = true;
			else openEnd = false;

			if (consecutive >= 2) {
				score = ScoreConsecutive(score, consecutive, openStart, openEnd);
			}

			consecutive = 0;
			openEnd = false;

			if (game[rowColDiagIndexList[i]] === PIECES.EMPTY) openStart = true;
			else openStart = false;
		}
	}

	if (consecutive >= 2) {
		score = ScoreConsecutive(score, consecutive, openStart, openEnd);
	}

	return score;
}

function ScoreConsecutive(currentScore, consecutive, openStart, openEnd) {
	if (consecutive === 2) return currentScore + ((openStart || openEnd) ? ((openStart && openEnd) ? 2*openEndPair : openEndPair) : pairScore);
	else if (consecutive === 3) return currentScore + ((openStart || openEnd) ? ((openStart && openEnd) ? 2*openEndTriplet : openEndTriplet) : tripletScore);
	else if (consecutive === 4) return currentScore + ((openStart || openEnd) ? ((openStart && openEnd) ? (Number.MAX_SAFE_INTEGER-1) : openEndQuad) : quadScore);
	return Number.MAX_SAFE_INTEGER;
}