const { PrettyResult, QuadrantSymmetricWithPiece, RotateBoard, Evaluate, CountColorsOnRowColDiag, ScoreAfterRotation } = require('./AI_Common_Functions');

let SEARCH_DEPTH;
let PIECES = { 'EMPTY': -1, 'BLACK': 0, 'WHITE': 1 };

let originalDepth = 1;
let bestIndex = -1;
let iterativeDeepening = [];
let searchCalls = 0n;

function SearchAux(gameStr, searchDepth, currentTurn, pieces) {
	SEARCH_DEPTH = searchDepth;
	PIECES = pieces;
	
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
			console.log("AI Winning Move:", PrettyResult(bestIndex));
			break;
		}

		console.log(`Depth (${depth}), Score (${result})`, PrettyResult(bestIndex), `Calls (${searchCalls})`, `msTime (${depthTime})`);
		depth++;

		depthOneResults.sort((a, b) => a[1] < b[1] ? 1 : -1);
		iterativeDeepening = depthOneResults.map(x => JSON.stringify(x[0]));
		depthOneResults = [];

		if (depth > GamePieces.filter(x => x === PIECES.EMPTY).length) break; 
	}

	return bestIndex;
}

let depthOneResults = [];

function Search(game, depth, player, currentTurn, alpha, beta) {
	searchCalls += 1n;

	let currentGameScore = Evaluate(game, player);

	if (depth <= 0) return currentGameScore;
	if (currentGameScore === Number.MAX_SAFE_INTEGER || currentGameScore === Number.MIN_SAFE_INTEGER) return currentGameScore;

	// let listOfMoves = (depth === originalDepth || depth === originalDepth - 1 || depth === originalDepth - 2) ? GetEmptyIndicesLowDepth(game, currentTurn) : GetEmptyIndices(game, currentTurn);
	let listOfMoves = GetEmptyIndices(game, currentTurn);

	if (listOfMoves.length === 0) return currentGameScore;

	let nextTurn = currentTurn === PIECES.BLACK ? PIECES.WHITE : PIECES.BLACK;

	if (player === currentTurn) {
		let bestScore = Number.MIN_SAFE_INTEGER;

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

		return bestScore;
	} else {
		let bestScore = Number.MAX_SAFE_INTEGER;

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

		return bestScore;
	}
}

function GetEmptyIndices(game, targetColor) {
	let emptyIndexList = [];
	let quadrantsChosen = 0;
	let indexScoreLookup = {};

	for (let i = 0; i < game.length; ++i) {
		if (game[i] === PIECES.EMPTY) {
			indexScoreLookup[i] = CountColorsOnRowColDiag(game, i, targetColor);

			if (!QuadrantSymmetricWithPiece(game, i, 0)) {
				emptyIndexList.push([i, 0, true]);
				emptyIndexList.push([i, 0, false]);
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

	emptyIndexList.sort((a, b) => {
		return indexScoreLookup[a[0]] > indexScoreLookup[b[0]] ? -1 : 1;
	});

	return emptyIndexList;
}


function GetEmptyIndicesLowDepth(game, targetColor) {
	let emptyIndexList = [];
	let quadrantsChosen = 0;
	let indexScoreLookup = {};

	let q0L = ScoreAfterRotation(game, [0, false], targetColor);
	let q0R = ScoreAfterRotation(game, [0, true], targetColor);
	let q1L = ScoreAfterRotation(game, [1, false], targetColor);
	let q1R = ScoreAfterRotation(game, [1, true], targetColor);
	let q2L = ScoreAfterRotation(game, [2, false], targetColor);
	let q2R = ScoreAfterRotation(game, [2, true], targetColor);
	let q3L = ScoreAfterRotation(game, [3, false], targetColor);
	let q3R = ScoreAfterRotation(game, [3, true], targetColor);

	for (let i = 0; i < game.length; ++i) {
		if (game[i] === PIECES.EMPTY) {
			indexScoreLookup[i] = CountColorsOnRowColDiag(game, i, targetColor);

			if (!QuadrantSymmetricWithPiece(game, i, 0)) {
				if (q0L !== Number.MIN_SAFE_INTEGER) emptyIndexList.push([i, 0, false]);
				if (q0R !== Number.MIN_SAFE_INTEGER) emptyIndexList.push([i, 0, true]);
				++quadrantsChosen;
			}

			if (!QuadrantSymmetricWithPiece(game, i, 1)) {
				if (q1L !== Number.MIN_SAFE_INTEGER) emptyIndexList.push([i, 1, false]);
				if (q1R !== Number.MIN_SAFE_INTEGER) emptyIndexList.push([i, 1, true]);
				++quadrantsChosen;
			}

			if (!QuadrantSymmetricWithPiece(game, i, 2)) {
				if (q2L !== Number.MIN_SAFE_INTEGER) emptyIndexList.push([i, 2, false]);
				if (q2R !== Number.MIN_SAFE_INTEGER) emptyIndexList.push([i, 2, true]);
				++quadrantsChosen;
			}

			if (!QuadrantSymmetricWithPiece(game, i, 3)) {
				if (q3L !== Number.MIN_SAFE_INTEGER) emptyIndexList.push([i, 3, false]);
				if (q3R !== Number.MIN_SAFE_INTEGER) emptyIndexList.push([i, 3, true]);
				++quadrantsChosen;
			}

			if (quadrantsChosen === 0) emptyIndexList.push([i, 0, false]);
		}
	}

	if (emptyIndexList.length === 0) process.exit(4);

	emptyIndexList.sort((a, b) => {
		return indexScoreLookup[a[0]] > indexScoreLookup[b[0]] ? -1 : 1;
	});

	return emptyIndexList;
}

module.exports = SearchAux;