const { PrettyResult, RotateBoard, Evaluate } = require('./AI_Common_Functions');

let SEARCH_DEPTH;
let PIECES = { 'EMPTY': -1, 'BLACK': 0, 'WHITE': 1 };

let originalDepth = 1;
let bestIndex = -1;
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

		let searchCallsStr = new Intl.NumberFormat('en-AU').format(searchCalls.toString());

		if (result === Number.MIN_SAFE_INTEGER) {
			console.log(`Depth (${depth}), AI will LOSE:`, PrettyResult(bestIndex), `Calls (${searchCallsStr})`, `msTime (${depthTime})`);
			break;
		}

		if (result === Number.MAX_SAFE_INTEGER) {
			console.log(`Depth (${depth}), Winning Move:`, PrettyResult(bestIndex), `Calls (${searchCallsStr})`, `msTime (${depthTime})`);
			break;
		}

		console.log(`Depth (${depth}), Score (${result})`, PrettyResult(bestIndex), `Calls (${searchCallsStr})`, `msTime (${depthTime})`);
		depth++;

		if (depth > GamePieces.filter(x => x === PIECES.EMPTY).length) break; 
	}

	return bestIndex;
}

function Search(game, depth, player, currentTurn, alpha, beta) {
	searchCalls += 1n;

	let currentGameScore = Evaluate(game, player);

	if (depth <= 0) return currentGameScore;
	if (currentGameScore === Number.MAX_SAFE_INTEGER || currentGameScore === Number.MIN_SAFE_INTEGER) return currentGameScore;

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

function GetEmptyIndices(game) {
	let emptyIndexList = [];

	for (let i = 0; i < game.length; ++i) {
		if (game[i] === PIECES.EMPTY) {
			emptyIndexList.push([i, 0, false]);
			emptyIndexList.push([i, 0, true]);
			emptyIndexList.push([i, 1, false]);
			emptyIndexList.push([i, 1, true]);
			emptyIndexList.push([i, 2, false]);
			emptyIndexList.push([i, 2, true]);
			emptyIndexList.push([i, 3, false]);
			emptyIndexList.push([i, 3, true]);
		}
	}

	return emptyIndexList;
}

module.exports = SearchAux;