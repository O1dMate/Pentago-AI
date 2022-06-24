let pairScore = 2; // Score for having two in a row
let tripletScore = 6; // Score for having three in a row
let quadScore = 20; // Score for having four in a row

let openEndPair = 8; // Score for two in a row, but with an open end.
let openEndTriplet = 20; // Score for three in a row, but with an open end.
let openEndQuad = 80; // Score for four in a row, but with an open end.

let PIECES = {'EMPTY': -1, 'BLACK': 0, 'WHITE': 1};
let TURN = {
	PLAYER: 0,
	AI: 1,
	PLAYER_COLOR: PIECES.BLACK,
	AI_COLOR: PIECES.WHITE
};
let CURRENT_TURN = TURN.AI;
let OTHER_PLAYER_LOOKUP = {[PIECES.WHITE]: PIECES.BLACK, [PIECES.BLACK]: PIECES.WHITE};
let currentlyHighlightedPieceIndex = -1;

let SEARCH_DEPTH = 8;

// Track what piece is in each location (will be 36 elements long).
let GamePieces = [];

const ROW_INDICES = [[0,1,2,3,4,5],[6,7,8,9,10,11],[12,13,14,15,16,17],[18,19,20,21,22,23],[24,25,26,27,28,29],[30,31,32,33,34,35]];
const COL_INDICES = [[0,6,12,18,24,30],[1,7,13,19,25,31],[2,8,14,20,26,32],[3,9,15,21,27,33],[4,10,16,22,28,34],[5,11,17,23,29,35]];
const DIAGONAL_INDICES = [[6,13,20,27,34],[0,7,14,21,28,35],[1,8,15,22,29],[24,19,14,9,4],[30,25,20,15,10,5],[31,26,21,16,11]];
const DIAGONAL_INDICES_FROM_INDEX = [];
const SURROUNDING_INDICES = [];
const SURROUNDING_INDICES_NO_EDGES = {};

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

		SURROUNDING_INDICES_NO_EDGES[i] = [
			(i-6), (i+6),
			(i-1), (i+1),
			(i-7), (i+7),
			(i-5), (i+5),
		];
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

// Initial Setup
function setup() {

	// Default Game Board is empty
	for (let i = 0; i < 36; ++i) {
		// GamePieces.push(Math.floor(Math.random()*3)-1); // Testing Only, change to -1 after
		GamePieces.push(PIECES.EMPTY);
	}

	let blackPieces = 3;
	let whitePieces = 3;

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

	// GamePieces = '-1,-1,-1,1,0,-1,0,-1,0,1,1,-1,0,-1,0,1,0,-1,-1,-1,-1,1,1,0,-1,-1,-1,-1,0,1,-1,-1,-1,-1,1,1'.split(',').map(x => parseInt(x));
	// GamePieces = '-1,-1,-1,-1,1,0,0,1,1,0,1,1,-1,-1,0,0,0,-1,-1,1,1,1,1,0,1,-1,0,-1,0,1,-1,0,-1,-1,-1,-1'.split(',').map(x => parseInt(x));

	// TODO, depth 7+ after first move (13, q4, right)
	GamePieces = '-1,-1,-1,-1,1,0,0,1,1,0,1,1,-1,-1,0,0,0,-1,0,1,1,0,1,-1,1,-1,0,1,0,-1,-1,0,-1,1,-1,-1'.split(',').map(x => parseInt(x));
	// GamePieces = '-1,-1,1,-1,-1,-1,-1,1,1,0,-1,-1,0,0,0,0,1,-1,1,0,1,-1,-1,-1,-1,-1,-1,-1,-1,-1,0,1,-1,-1,-1,-1'.split(',').map(x => parseInt(x));

	// GamePieces[7] = PIECES.WHITE;
	// GamePieces[14] = PIECES.BLACK;
	// GamePieces[21] = PIECES.BLACK;
	// GamePieces[22] = PIECES.WHITE;
	// GamePieces[27] = PIECES.WHITE;
	// GamePieces[28] = PIECES.BLACK;
	// GamePieces[33] = PIECES.WHITE;

	// GamePieces[26] = PIECES.BLACK;
	// GamePieces[8] = PIECES.WHITE;
	// GamePieces[3] = PIECES.BLACK;
	// GamePieces[10] = PIECES.WHITE;

	// GamePieces[6] = PIECES.BLACK;
	// RotateBoard(GamePieces, 1, false);

	// GamePieces[9] = PIECES.WHITE;
	// RotateBoard(GamePieces, 2, true);

	draw();
	draw();
	draw();
}

let gameHistory = [];
let searchCalls = 0n;
let computeAiMove = false;
let gameOver = false;

// To be called each frame
function draw() {

	if (computeAiMove && !gameOver) {
		// If the board is empty, choose a random starting move.
		if (GamePieces.filter(x => x === PIECES.EMPTY).length === GamePieces.length) {
			GamePieces[Math.floor(Math.random()*GamePieces.length)] = TURN.AI_COLOR;
		} else {
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
	GamePieces = newState.split(',').map(x => parseInt(x));

	gameOver = false;
	computeAiMove = false;
	CURRENT_TURN = TURN.PLAYER;
}

function PlayerMove(location, quadrant, direction) {
	direction = direction === 'r' ? true : false;

	if (location >= 0 && location < GamePieces.length && GamePieces[location] === PIECES.EMPTY) {
		GamePieces[location] = PIECES.WHITE;
		RotateBoard(GamePieces, quadrant, direction);
		console.log('Player Move:', PrettyResult([location, quadrant, direction]));
		CURRENT_TURN = TURN.AI;
	}
}

let originalDepth = 1;
let bestIndex = -1;
let iteriveDeepening = null;

function SearchAux(game, currentTurn) {
	let depth = 1;
	let depthTime = 0;
	searchCalls = 0n;

	while (depth <= SEARCH_DEPTH) {
		try {
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
				console.log("AI Winning Move:", bestIndex);
				break;
			} 

			iteriveDeepening = bestIndex[0];
			console.log(`Depth (${depth++}), Score (${result})`, PrettyResult(bestIndex), `Calls (${searchCalls})`, `msTime (${depthTime})`);
		} catch (err) {
			console.log(err);
			console.log({depth, searchCalls});
		}
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

			if (depth === originalDepth && evaluationOfMove > bestScore) bestIndex = listOfMoves[i];
			bestScore = Math.max(bestScore, evaluationOfMove);

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
			// let scoreA = CountColorsOnRowColDiagV1(game, a[0], targetColor);
			// let scoreB = CountColorsOnRowColDiagV1(game, b[0], targetColor);
			let scoreA = CountColorsOnRowColDiagv2(game, a, targetColor);
			let scoreB = CountColorsOnRowColDiagv2(game, b, targetColor);
			// let scoreA = CountColorsOnRowColDiagv3(game, a, targetColor);
			// let scoreB = CountColorsOnRowColDiagv3(game, b, targetColor);

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

// const EvaluationFuncHistoryMaxSize = 20_000_000; // Max number of entries in the below Map
// let EvaluationFuncHistory = new Map();
// let EvaluateFuncReturnValue = 0;

function Evaluate(game, targetColor) {
	// let gameStr = game.toString();
	let whiteStrength = 0;
	let blackStrength = 0;
	// let hasResultStored = EvaluationFuncHistory.get(gameStr);

	// if (hasResultStored) {
	// 	if (targetColor === PIECES.WHITE) return hasResultStored[0];
	// 	return hasResultStored[1];
	// }

	whiteStrength = EvaluateStrength(game, PIECES.WHITE);
	blackStrength = EvaluateStrength(game, PIECES.BLACK);

	let EvaluateFuncReturnValue = 0;

	if (whiteStrength === blackStrength) EvaluateFuncReturnValue = 0;
	else if (targetColor === PIECES.WHITE && whiteStrength === Number.MAX_SAFE_INTEGER) EvaluateFuncReturnValue = Number.MAX_SAFE_INTEGER;
	else if (targetColor === PIECES.WHITE && blackStrength === Number.MAX_SAFE_INTEGER) EvaluateFuncReturnValue = Number.MIN_SAFE_INTEGER;
	else if (targetColor === PIECES.BLACK && blackStrength === Number.MAX_SAFE_INTEGER) EvaluateFuncReturnValue = Number.MAX_SAFE_INTEGER;
	else if (targetColor === PIECES.BLACK && whiteStrength === Number.MAX_SAFE_INTEGER) EvaluateFuncReturnValue = Number.MIN_SAFE_INTEGER;
	else if (targetColor === PIECES.WHITE) EvaluateFuncReturnValue = whiteStrength - blackStrength;
	else EvaluateFuncReturnValue = blackStrength - whiteStrength;

	// if (EvaluateFuncReturnValue < 0) EvaluateFuncReturnValue -= 100;

	// if (EvaluationFuncHistory.size <= EvaluationFuncHistoryMaxSize) {
	// 	if (targetColor === PIECES.WHITE) {
	// 		EvaluationFuncHistory.set(gameStr, [EvaluateFuncReturnValue, -EvaluateFuncReturnValue]);
	// 	} else {
	// 		EvaluationFuncHistory.set(gameStr, [-EvaluateFuncReturnValue, EvaluateFuncReturnValue]);
	// 	}
	// }

	return EvaluateFuncReturnValue;
}

function EvaluateStrength(game, targetColor) {
	let score = 0;
	let tempScore;

	for (let i = 0; i < ROW_INDICES.length; ++i) {
		tempScore = CountRowColDiagScore(ROW_INDICES[i].map(index => game[index]), targetColor);

		if (tempScore === Number.MAX_SAFE_INTEGER) return tempScore;
		score += tempScore;
	}

	for (let i = 0; i < COL_INDICES.length; ++i) {
		tempScore = CountRowColDiagScore(COL_INDICES[i].map(index => game[index]), targetColor);

		if (tempScore === Number.MAX_SAFE_INTEGER) return tempScore;
		score += tempScore;
	}

	for (let i = 0; i < DIAGONAL_INDICES.length; ++i) {
		tempScore = CountRowColDiagScore(DIAGONAL_INDICES[i].map(index => game[index]), targetColor);

		if (tempScore === Number.MAX_SAFE_INTEGER) return tempScore;
		score += tempScore;
	}

	return score;
}

function CountColorsOnRowColDiagV1(game, index, targetColor, print=false) {
	let rowIndices = ROW_INDICES[Math.floor(index/6)];
	let colIndices = COL_INDICES[index%6];
	let diagIndices = DIAGONAL_INDICES_FROM_INDEX[index];
	let nearbyIndices = SURROUNDING_INDICES[index];
	// let nearbyIndicesNoEdges = SURROUNDING_INDICES_NO_EDGES[index];
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

	// if (nearbyIndicesNoEdges) {
	// 	for (let i = 0; i < nearbyIndicesNoEdges.length; i+=2) {
	// 		if (game[nearbyIndicesNoEdges[i]] === OTHER_PLAYER_LOOKUP[targetColor] && game[nearbyIndicesNoEdges[i]] === game[nearbyIndicesNoEdges[i+1]]) count += 5;
	// 	}
	// }

	return count;
}

// BAD IDEA
function CountColorsOnRowColDiagv2(game, move, targetColor) {
	game[move[0]] = targetColor;
	RotateBoard(game, move[1], move[2]);

	let result = Evaluate(game, targetColor);

	RotateBoard(game, move[1], !move[2]);
	game[move[0]] = -1;
	return result;
}

// BAD IDEA
// function CountColorsOnRowColDiagv3(game, move, targetColor) {
// 	game[move[0]] = targetColor;
// 	RotateBoard(game, move[1], move[2]);

// 	let result = CountColorsOnRowColDiagV1(game, move[0], targetColor);

// 	RotateBoard(game, move[1], !move[2]);
// 	game[move[0]] = -1;
// 	return result;
// }

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
	if (consecutive === 2) return currentScore + ((openStart || openEnd) ? ((openStart && openEnd) ? 2*openEndPair : openEndPair) : pairScore);
	else if (consecutive === 3) return currentScore + ((openStart || openEnd) ? ((openStart && openEnd) ? 2*openEndTriplet : openEndTriplet) : tripletScore);
	else if (consecutive === 4) return currentScore + ((openStart || openEnd) ? ((openStart && openEnd) ? Number.MAX_SAFE_INTEGER : openEndQuad) : quadScore);
	return Number.MAX_SAFE_INTEGER;
}

setup();