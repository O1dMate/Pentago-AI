let pairScore = 2; // Score for having two in a row
let tripletScore = 6; // Score for having three in a row
let quadScore = 10; // Score for having four in a row

let openEndPair = 3; // Score for two in a row, but with an open end.
let openEndTriplet = 12; // Score for three in a row, but with an open end.
let openEndQuad = 20; // Score for four in a row, but with an open end.

let PIECES = {'EMPTY': -1, 'BLACK': 0, 'WHITE': 1};
let TURN = {PLAYER: 0, AI: 1, PLAYER_COLOR: PIECES.WHITE, AI_COLOR: PIECES.BLACK};
let CURRENT_TURN = TURN.AI;
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

const ROW_INDICES = [[0,1,2,3,4,5],[6,7,8,9,10,11],[12,13,14,15,16,17],[18,19,20,21,22,23],[24,25,26,27,28,29],[30,31,32,33,34,35]];
const COL_INDICES = [[0,6,12,18,24,30],[1,7,13,19,25,31],[2,8,14,20,26,32],[3,9,15,21,27,33],[4,10,16,22,28,34],[5,11,17,23,29,35]];
const DIAGONAL_INDICES = [[6,13,20,27,34],[0,7,14,21,28,35],[1,8,15,22,29],[24,19,14,9,4],[30,25,20,15,10,5],[31,26,21,16,11]];
const DIAGONAL_INDICES_FROM_INDEX = [];
for (let i = 0; i < 36; ++i) {
	let currentArray = [];
	DIAGONAL_INDICES.forEach((diagIndices, index) => {
		diagIndices.forEach(diagIndex => {
			if (i === diagIndex) currentArray.push(index);
		})
	});
	DIAGONAL_INDICES_FROM_INDEX.push(currentArray);
}

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
		GamePieces.push(PIECES.EMPTY);
	}

	let blackPieces = 5;
	let whitePieces = 5;

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

	GamePieces = '-1,-1,-1,1,0,-1,0,-1,0,1,1,-1,0,-1,0,1,0,-1,-1,-1,-1,1,1,0,-1,-1,-1,-1,0,1,-1,-1,-1,-1,1,1'.split(',').map(x => parseInt(x));

	frameRate(30);
}

let gameHistory = [];
let searchCalls = 0;
let computeAiMove = false;
let gameOver = false;

// To be called each frame
function draw() {
	// if (frameCount > 1) return;

	// Draw background & set Rectangle draw mode
	background(30);
	rectMode(CENTER);

	// Draw Game Board
	DrawBoard();

	if (frameCount > 1 && computeAiMove && !gameOver) {
		SEARCH_DEPTH = 4;

		// If the board is empty, choose a random starting move.
		if (GamePieces.filter(x => x === PIECES.EMPTY).length === GamePieces.length) {
			GamePieces[Math.floor(Math.random()*GamePieces.length)] = TURN.AI_COLOR;
		} else {
			searchCalls = 0;
			let result = SearchAux(GamePieces, TURN.AI_COLOR);
			console.log(result);
			gameHistory.push(GamePieces.toString());
			GamePieces[result[0]] = TURN.AI_COLOR;
			RotateBoard(GamePieces, result[1], result[2]);
		}

		CURRENT_TURN = TURN.PLAYER;
		computeAiMove = false;

		if (Math.abs(Evaluate(GamePieces, TURN.AI_COLOR)) === Number.MAX_SAFE_INTEGER) {
			gameOver = true;
		}
	}
	// else if (frameCount > 1 && !gameOver) {
	// 	searchCalls = 0;
	// 	SEARCH_DEPTH = 3;
	// 	let result = SearchAux(GamePieces, TURN.PLAYER_COLOR);
	// 	console.log(result);
	// 	gameHistory.push(GamePieces.toString());
	// 	GamePieces[result[0]] = TURN.PLAYER_COLOR;
	// 	RotateBoard(GamePieces, result[1], result[2]);
	// 	CURRENT_TURN = TURN.AI;

	// 	if (Math.abs(Evaluate(GamePieces, TURN.AI_COLOR)) === Number.MAX_SAFE_INTEGER) {
	// 		gameOver = true;
	// 	}
	// }

	if (CURRENT_TURN === TURN.AI) computeAiMove = true;
}

let playerQuadrantSelection = 0;
let playerRotationDirection = false;

function undo() {
	if (gameHistory.length <= 0) return;
	gameHistory.pop();
	let newState = gameHistory.pop();
	// console.log(gameHistory, newState);

	GamePieces = newState.split(',').map(x => parseInt(x));
	CURRENT_TURN = TURN.PLAYER;
	gameOver = false;
}

function mousePressed() {
	if (currentlyHighlightedPieceIndex !== -1 && CURRENT_TURN === TURN.PLAYER && !gameOver) {
		gameHistory.push(GamePieces.toString());
		GamePieces[currentlyHighlightedPieceIndex] = TURN.PLAYER_COLOR;
		RotateBoard(GamePieces, playerQuadrantSelection, playerRotationDirection);
		CURRENT_TURN = TURN.AI;

		if (Math.abs(Evaluate(GamePieces, TURN.AI_COLOR)) === Number.MAX_SAFE_INTEGER) {
			gameOver = true;
		}
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



function PlayerMove(location, quadrant, direction) {
	direction = direction === 'r' ? true : false;
	if (location >= 0 && location < GamePieces.length && GamePieces[location] === PIECES.EMPTY) {
		GamePieces[location] = PIECES.WHITE;
		RotateBoard(GamePieces, quadrant, direction);
		console.log('Player Move:', PrettyResult([location, quadrant, direction]));
		CURRENT_TURN = TURN.AI;
	} else {
		console.log('Invalid Move');
	}
}

let originalDepth = 1;
let bestIndex = -1;
let iteriveDeepening = null;

function SearchAux(game, currentTurn) {
	let depth = 1;
	searchCalls = 0;

	while (depth <= SEARCH_DEPTH) {
		searchCalls = 0;
		originalDepth = depth;
		result = Search(game, depth, currentTurn, currentTurn, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);

		if (depth === 1 && result === Number.MIN_SAFE_INTEGER) {
			console.log('AI LOST!!!');
			break;
		}

		if (result === Number.MAX_SAFE_INTEGER) {
			console.log("AI Winning Move:", bestIndex);
			break;
		} 

		iteriveDeepening = bestIndex[0];
		console.log(`Depth (${depth++}), Score (${result})`, PrettyResult(bestIndex), `Calls (${searchCalls})`);
		// console.log(iteriveDeepening);
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
	searchCalls++;

	let currentGameScore = Evaluate(game, player);
	if (depth <= 0) return currentGameScore;
	if (currentGameScore === Number.MAX_SAFE_INTEGER || currentGameScore === Number.MIN_SAFE_INTEGER) return currentGameScore;

	let listOfMoves = GetEmptyIndicies(game, currentTurn);

	// console.log(listOfMoves);

	if (listOfMoves.length === 0) {
		console.log("NO MOVES!!!!", depth);
		return 0;
	}

	let nextTurn = currentTurn === PIECES.BLACK ? PIECES.WHITE : PIECES.BLACK;

	if (player === currentTurn) {
		let bestScore = Number.MIN_SAFE_INTEGER;

		for (let i = 0; i < listOfMoves.length; ++i) {
			let GamePiecesWithMove = game.map(x => x);
			GamePiecesWithMove[listOfMoves[i][0]] = currentTurn;
			RotateBoard(GamePiecesWithMove, listOfMoves[i][1], listOfMoves[i][2]);

			let evaluationOfMove = Search(GamePiecesWithMove, depth-1, player, nextTurn, alpha, beta);
			// if (depth === originalDepth) console.log(evaluationOfMove, listOfMoves[i]);
			if (depth === originalDepth && evaluationOfMove > bestScore) bestIndex = listOfMoves[i];
			bestScore = Math.max(bestScore, evaluationOfMove);

			// console.log(`Move: (${evaluationOfMove})`, listOfMoves[i]);

			if (bestScore >= beta) break;

			alpha = Math.max(alpha, bestScore);
		}

		return bestScore;
	} else {
		let bestScore = Number.MAX_SAFE_INTEGER;

		for (let i = 0; i < listOfMoves.length; ++i) {
			let GamePiecesWithMove = game.map(x => x);
			GamePiecesWithMove[listOfMoves[i][0]] = currentTurn;
			RotateBoard(GamePiecesWithMove, listOfMoves[i][1], listOfMoves[i][2]);

			let evaluationOfMove = Search(GamePiecesWithMove, depth-1, player, nextTurn, alpha, beta);

			// if (evaluationOfMove === Number.MIN_SAFE_INTEGER) console.log(listOfMoves[i]);

			bestScore = Math.min(bestScore, evaluationOfMove); // Min here because we assume opponent chooses best possible move
			
			if (bestScore <= alpha) break;

			beta = Math.min(beta, bestScore);
		}

		return bestScore;
	}






	// Loop over each possible move
	// for (let i = 0; i < listOfMoves.length; ++i) {
	// 	// console.log("Searching:", (currentTurn === PIECES.WHITE ? 'WHITE' : 'BLACK'), Evaluate(game, currentTurn));

	// 	let GamePiecesWithMove = game.map(x => x);
	// 	GamePiecesWithMove[listOfMoves[i][0]] = currentTurn;
	// 	RotateBoard(GamePiecesWithMove, listOfMoves[i][1], listOfMoves[i][2]);

	// 	let nextTurn = currentTurn === PIECES.BLACK ? PIECES.WHITE : PIECES.BLACK;
	// 	let evaluationOfMove = Search(GamePiecesWithMove, depth-1, player, nextTurn, alpha, beta);

	// 	if (player === currentTurn) {
	// 		bestScore = Math.max(bestScore, evaluationOfMove);
	// 		if (bestScore >= beta) return bestScore;

	// 		alpha = Math.max(alpha, bestScore);

	// 		// if (depth === originalDepth && evaluationOfMove > bestScore) {
	// 		// 	bestIndex = listOfMoves[i];
	// 		// }
	// 		// // bestOpponentMove = Math.min(bestOpponentMove, evaluationOfMove);
	// 		// // // if (bestOpponentMove === null) bestOpponentMove = evaluationOfMove;

	// 		// // if (evaluationOfMove < bestOpponentMove) {
	// 		// // }
	// 	} else {
	// 		// if (evaluationOfMove === Number.MIN_SAFE_INTEGER) return evaluationOfMove;
	// 		// bestScore = Math.min(bestScore, evaluationOfMove);
	// 		// if (bestScore < bestOpponentMove) return bestScore;
	// 	}
	// 	// bestOpponentMove = Math.min(bestOpponentMove, evaluationOfMove);

	// 	// evals.push(evaluationOfMove);
	// 	// if (evaluationOfMove === -Number.MAX_SAFE_INTEGER) {
	// 		// console.log('evaluationOfMove', evaluationOfMove, alpha, beta);
	// 	// console.log('move', evaluationOfMove, listOfMoves[i]);
	// 	// }

	// 	// if (depth === 7) console.log('evaluationOfMove', evaluationOfMove, alpha, beta);
	// 	// console.log('evaluationOfMove', evaluationOfMove, alpha, beta);
	// 	// console.log(listOfMoves[i], evaluationOfMove);
	// 	// if (evaluationOfMove > bestScore) {
	// 	// 	bestScore = evaluationOfMove;
	// 	// 	if (depth === originalDepth) bestIndex = listOfMoves[i];
	// 	// }

	// 	// if (evaluationOfMove >= beta) return beta;
	// 	// alpha = Math.max(evaluationOfMove, alpha);

	// }

	// console.log("Best Move:", bestIndex, `score (${bestScore}) depth (${depth})`, alpha, beta)

	return bestScore;
}

function GetEmptyIndicies(game, targetColor) {
	let emptyIndexList = [];
	let quadrantsChoosen = 0;

	for (let i = 0; i < game.length; ++i) {
		if (game[i] === PIECES.EMPTY) {

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
			return a[0] === iteriveDeepening ? 1 : b[0] === iteriveDeepening ? -1 : 0;
		});

		iteriveDeepening = null;
	} else {
		emptyIndexList.sort((a,b) => {
			let scoreA = CountColorsOnRowColDiag(game, a[0], targetColor);
			let scoreB = CountColorsOnRowColDiag(game, b[0], targetColor);

			return scoreA > scoreB ? -1 : 1;
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
		// console.log((QUADRANT_SYMMETRIC_INDICES[i]+plusAmount), (game[QUADRANT_SYMMETRIC_INDICES[i]+plusAmount]));
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
	let tempBoard = game.map(x => x);

	let plusAmount = QUADRANT_PLUS_AMOUNTS[quadrant];

	for (let i = 0; i < QUADRANT_INDICES.length; ++i) {
		if (!direction) game[QUADRANT_INDICES[i]+plusAmount] = tempBoard[QUADRANT_INDICES[i]+plusAmount+LEFT_TURN_ADD_AMOUNT[i]];
		else game[QUADRANT_INDICES[i]+plusAmount] = tempBoard[QUADRANT_INDICES[i]+plusAmount+RIGHT_TURN_ADD_AMOUNT[i]];
	}
}

// function EvaluateAux(game, targetColor) {
// 	let listOfMoves = GetEmptyIndicies(game, targetColor);

// 	for (let i = 0; i < listOfMoves.length; ++i) {

// 	}
// }

function Evaluate(game, targetColor) {
	let whiteStrength = EvaluateStrength(game, PIECES.WHITE);
	let blackStrength = EvaluateStrength(game, PIECES.BLACK);

	if (targetColor === PIECES.WHITE && whiteStrength === Number.MAX_SAFE_INTEGER) return Number.MAX_SAFE_INTEGER;
	else if (targetColor === PIECES.BLACK && blackStrength === Number.MAX_SAFE_INTEGER) return Number.MAX_SAFE_INTEGER;
	else if (targetColor === PIECES.WHITE && blackStrength === Number.MAX_SAFE_INTEGER) return Number.MIN_SAFE_INTEGER;
	else if (targetColor === PIECES.BLACK && whiteStrength === Number.MAX_SAFE_INTEGER) return Number.MIN_SAFE_INTEGER;

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

function CountColorsOnRowColDiag(game, index, targetColor, print=false) {
	let rowIndices = ROW_INDICES[Math.floor(index/6)];
	let colIndices = COL_INDICES[index%6];
	let diagIndices = DIAGONAL_INDICES_FROM_INDEX[index];
	let count = 0;

	for (let i = 0; i < rowIndices.length; ++i) {
		if (print) console.log('row', rowIndices[i]);
		if (game[rowIndices[i]] === targetColor) ++count;
	}

	for (let i = 0; i < colIndices.length; ++i) {
		if (print) console.log('col', colIndices[i]);
		if (game[colIndices[i]] === targetColor) ++count;
	}

	for (let i = 0; i < diagIndices.length; ++i) {
		for (let j = 0; j < DIAGONAL_INDICES[diagIndices[i]].length; ++j) {
			if (print) console.log('diag', DIAGONAL_INDICES[diagIndices[i]][j]);
			if (game[DIAGONAL_INDICES[diagIndices[i]][j]] === targetColor) ++count;
		}
	}

	return count;
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