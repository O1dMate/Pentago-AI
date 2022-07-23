const { PrettyResult, QuadrantSymmetricWithPiece, RotateBoard, Evaluate, CountColorsOnRowColDiag } = require('./AI_Common_Functions');

let SEARCH_DEPTH;
let PIECES = { 'EMPTY': -1, 'BLACK': 0, 'WHITE': 1 };

let originalDepth = 1;
let bestIndex = -1;
let iterativeDeepening = [];
let searchCalls = 0n;

function SearchAux(gameStr, searchDepth, currentTurn, pieces, scores) {
	SEARCH_DEPTH = searchDepth;
	PIECES = pieces;

	pairScore = scores.pairScore;
	tripletScore = scores.tripletScore;
	quadScore = scores.quadScore;
	openEndPair = scores.openEndPair;
	openEndTriplet = scores.openEndTriplet;
	openEndQuad = scores.openEndQuad;
	
	let GamePieces = gameStr.split(',').map(x => parseInt(x));

	searchCalls = 0n;
	let depth = 1;
	let depthTime = 0;

	while (depth <= SEARCH_DEPTH) {
		searchCalls = 0n;
		originalDepth = depth;

		depthTime = Date.now();
		result = Search(GamePieces, depth, currentTurn, currentTurn, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
		depthTime = Date.now() - depthTime;

		if (depth === 1 && result === Number.MIN_SAFE_INTEGER) {
			console.log('AI LOST!!!');
			break;
		}

		if (result === Number.MAX_SAFE_INTEGER) {
			console.log(`Depth (${depth}), Winning Move:`, PrettyResult(bestIndex), `Calls (${searchCalls})`, `msTime (${depthTime})`);
			break;
		}

		console.log(`Depth (${depth}), Score (${result})`, PrettyResult(bestIndex), `Calls (${searchCalls})`, `msTime (${depthTime})`);
		SearchResultMap.clear();

		depthOneResults.sort((a, b) => a[1] < b[1] ? 1 : -1);
		iterativeDeepening = depthOneResults.map(x => JSON.stringify(x[0]));
		depthOneResults = [];

		depth++;

		if (depth > GamePieces.filter(x => x === PIECES.EMPTY).length) break; 
	}

	return bestIndex;
}

const FULL_ROTATE_RIGHT_INDEX_MAP = [30, 24, 18, 12, 6, 0, 31, 25, 19, 13, 7, 1, 32, 26, 20, 14, 8, 2, 33, 27, 21, 15, 9, 3, 34, 28, 22, 16, 10, 4, 35, 29, 23, 17, 11, 5];

function FullRotateRight(game) {
	let tempGame = game.map(x => x);

	for (let i = 0; i < FULL_ROTATE_RIGHT_INDEX_MAP.length; ++i) {
		game[i] = tempGame[FULL_ROTATE_RIGHT_INDEX_MAP[i]];
	}
}

const SearchResultMapMaxSize = 10_000_000;
let SearchResultMap = new Map();

let depthOneResults = [];

function Search(game, depth, player, currentTurn, alpha, beta) {
	// let startGame = game.toString();
	let gameStrKey1 = game.toString();
	FullRotateRight(game);
	let gameStrKey2 = game.toString();
	FullRotateRight(game);
	let gameStrKey3 = game.toString();
	FullRotateRight(game);
	let gameStrKey4 = game.toString();
	FullRotateRight(game);

	let cachedResult1 = SearchResultMap.get(gameStrKey1);
	let cachedResult2 = SearchResultMap.get(gameStrKey2);
	let cachedResult3 = SearchResultMap.get(gameStrKey3);
	let cachedResult4 = SearchResultMap.get(gameStrKey4);

	if (cachedResult1 !== undefined || cachedResult2 !== undefined || cachedResult3 !== undefined || cachedResult4 !== undefined) {
		return (cachedResult1 || cachedResult2 || cachedResult3 || cachedResult4);
	}

	searchCalls += 1n;

	let currentGameScore = Evaluate(game, player);

	if (depth <= 0) {
		if (SearchResultMap.size <= SearchResultMapMaxSize) {
			SearchResultMap.set(gameStrKey1, currentGameScore);
			SearchResultMap.set(gameStrKey2, currentGameScore);
			SearchResultMap.set(gameStrKey3, currentGameScore);
			SearchResultMap.set(gameStrKey4, currentGameScore);
		}
		return currentGameScore;
	}
	if (currentGameScore === Number.MAX_SAFE_INTEGER || currentGameScore === Number.MIN_SAFE_INTEGER) {
		if (SearchResultMap.size <= SearchResultMapMaxSize) {
			SearchResultMap.set(gameStrKey1, currentGameScore);
			SearchResultMap.set(gameStrKey2, currentGameScore);
			SearchResultMap.set(gameStrKey3, currentGameScore);
			SearchResultMap.set(gameStrKey4, currentGameScore);
		}
		return currentGameScore;
	}

	let listOfMoves = GetEmptyIndices(game, currentTurn);

	if (listOfMoves.length === 0) {
		if (SearchResultMap.size <= SearchResultMapMaxSize) {
			SearchResultMap.set(gameStrKey1, currentGameScore);
			SearchResultMap.set(gameStrKey2, currentGameScore);
			SearchResultMap.set(gameStrKey3, currentGameScore);
			SearchResultMap.set(gameStrKey4, currentGameScore);
		}
		return currentGameScore;
	}

	let nextTurn = currentTurn === PIECES.BLACK ? PIECES.WHITE : PIECES.BLACK;
	let bestScore;

	if (player === currentTurn) {
		bestScore = Number.MIN_SAFE_INTEGER;

		for (let i = 0; i < listOfMoves.length; ++i) {
			// Modify the Game Board with the move
			game[listOfMoves[i][0]] = currentTurn;
			RotateBoard(game, listOfMoves[i][1], listOfMoves[i][2]);
			let evaluationOfMove = Search(game, depth-1, player, nextTurn, alpha, beta);

			// Undo the move from Game Board
			RotateBoard(game, listOfMoves[i][1], !listOfMoves[i][2]);
			game[listOfMoves[i][0]] = -1;

			if (depth === originalDepth) {
				depthOneResults.push([JSON.parse(JSON.stringify(listOfMoves[i])), evaluationOfMove]);
			}

			if (depth === originalDepth && evaluationOfMove > bestScore) bestIndex = listOfMoves[i];
			bestScore = Math.max(bestScore, evaluationOfMove);

			if (bestScore >= beta) break;

			alpha = Math.max(alpha, bestScore);
		}
	} else {
		bestScore = Number.MAX_SAFE_INTEGER;

		for (let i = 0; i < listOfMoves.length; ++i) {
			// Modify the Game Board with the move
			game[listOfMoves[i][0]] = currentTurn;
			RotateBoard(game, listOfMoves[i][1], listOfMoves[i][2]);

			let evaluationOfMove = Search(game, depth-1, player, nextTurn, alpha, beta);

			// Undo the move from Game Board
			RotateBoard(game, listOfMoves[i][1], !listOfMoves[i][2]);
			game[listOfMoves[i][0]] = -1;

			bestScore = Math.min(bestScore, evaluationOfMove); // Min here because we assume opponent chooses best possible move

			if (bestScore <= alpha) break;

			beta = Math.min(beta, bestScore);
		}
	}
	
	// Unsure why this isn't working???
	if (SearchResultMap.size <= SearchResultMapMaxSize && depth > 2) {
		SearchResultMap.set(gameStrKey1, bestScore);
		SearchResultMap.set(gameStrKey2, bestScore);
		SearchResultMap.set(gameStrKey3, bestScore);
		SearchResultMap.set(gameStrKey4, bestScore);
	}

	return bestScore;
}

function GetEmptyIndices(game, targetColor) {
	let emptyIndexList = [];
	let quadrantsChosen = 0;
	let indexScoreLookup = {};

	for (let i = 0; i < game.length; ++i) {
		if (game[i] === PIECES.EMPTY) {
			indexScoreLookup[i] = CountColorsOnRowColDiag(game, i, targetColor);

			if (!QuadrantSymmetricWithPiece(game, i, 0)) {
				emptyIndexList.push([i, 0, false]);
				emptyIndexList.push([i, 0, true]);
				++quadrantsChosen;
			}

			if (!QuadrantSymmetricWithPiece(game, i, 1)) {
				emptyIndexList.push([i, 1, false]);
				emptyIndexList.push([i, 1, true]);
				++quadrantsChosen;
			}

			if (!QuadrantSymmetricWithPiece(game, i, 2)) {
				emptyIndexList.push([i, 2, false]);
				emptyIndexList.push([i, 2, true]);
				++quadrantsChosen;
			}

			if (!QuadrantSymmetricWithPiece(game, i, 3)) {
				emptyIndexList.push([i, 3, false]);
				emptyIndexList.push([i, 3, true]);
				++quadrantsChosen;
			}

			if (quadrantsChosen === 0) emptyIndexList.push([i, 0, false]);
		}
	}

	if (iterativeDeepening) {
		emptyIndexList.sort((a, b) => {
			let indexA = iterativeDeepening.indexOf(JSON.stringify(a));
			let indexB = iterativeDeepening.indexOf(JSON.stringify(b));

			if (indexA === indexB) return 0;
			if (indexA > indexB) return 1;
			return -1;
		});
		// console.log(emptyIndexList);

		iterativeDeepening = null;
	} else {
		emptyIndexList.sort((a,b) => {
			return indexScoreLookup[a[0]] > indexScoreLookup[b[0]] ? -1 : 1;
		});
	}

	return emptyIndexList;
}

module.exports = SearchAux;