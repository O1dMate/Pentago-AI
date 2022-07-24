const { PrettyResult, RotateBoard, Evaluate, CountColorsOnRowColDiag, IsForcedMoveForPlayer, ForcedMoveToStopFourInARowWithOpenEnds, ForcedMoveToPreventWin } = require('./AI_Common_Functions');

let SEARCH_DEPTH;
let PIECES = { 'EMPTY': -1, 'BLACK': 0, 'WHITE': 1 };
const OTHER_PLAYER_LOOKUP = { [PIECES.WHITE]: PIECES.BLACK, [PIECES.BLACK]: PIECES.WHITE };

let originalDepth = 1;
let bestIndex = -1;
let iterativeDeepening = [];
let searchCalls = 0n;

function convertRowToInt(a, b, c, d, e, f) {
	let values = [
		(a === PIECES.EMPTY ? 0 : (a === PIECES.BLACK ? 1 : 2)) << 10,
		(b === PIECES.EMPTY ? 0 : (b === PIECES.BLACK ? 1 : 2)) << 8,
		(c === PIECES.EMPTY ? 0 : (c === PIECES.BLACK ? 1 : 2)) << 6,
		(d === PIECES.EMPTY ? 0 : (d === PIECES.BLACK ? 1 : 2)) << 4,
		(e === PIECES.EMPTY ? 0 : (e === PIECES.BLACK ? 1 : 2)) << 2,
		(f === PIECES.EMPTY ? 0 : (f === PIECES.BLACK ? 1 : 2)),
	];

	return (values[0] | values[1] | values[2] | values[3] | values[4] | values[5]);
}

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
			console.log(`Depth (${depth}), Winning Move:`, PrettyResult(bestIndex), `Calls (${searchCalls})`, `msTime (${depthTime})`);
			break;
		}

		console.log(`Depth (${depth}), Score (${result})`, PrettyResult(bestIndex), `Calls (${searchCalls})`, `msTime (${depthTime})`);
		depth++;
		
		depthOneResults.sort((a, b) => a[1] < b[1] ? 1 : -1);
		iterativeDeepening = depthOneResults.map(x => JSON.stringify(x[0]));
		depthOneResults = [];
		
		// console.log(`Cache Size (${SearchResultsMap.size}), Hits (${cacheHits}), Misses (${cacheMisses})`)
		// SearchResultsMap.clear();
		// cacheHits = 0n;
		// cacheMisses = 0n;

		if (depth > GamePieces.filter(x => x === PIECES.EMPTY).length) break;
	}

	return bestIndex;
}

// let SearchResultsMap = new Map();
// let cacheHits = 0n;
// let cacheMisses = 0n;
let depthOneResults = [];

function Search(game, depth, player, currentTurn, alpha, beta) {
	// let gameKey = game.toString() + currentTurn;

	// if (SearchResultsMap.has(gameKey)) {
	// 	cacheHits += 1n;
	// 	return SearchResultsMap.get(gameKey);
	// } else {
	// 	cacheMisses += 1n;
	// }

	searchCalls += 1n;

	let currentGameScore = Evaluate(game, player);

	if (depth <= 0 || currentGameScore === Number.MAX_SAFE_INTEGER || currentGameScore === Number.MIN_SAFE_INTEGER) {
		// SearchResultsMap.set(gameKey, currentGameScore);
		return currentGameScore;
	};

	let listOfMoves = GetEmptyIndices(game, currentTurn);

	if (listOfMoves.length === 0) {
		// SearchResultsMap.set(gameKey, currentGameScore);
		return currentGameScore;
	};

	let nextTurn = OTHER_PLAYER_LOOKUP[currentTurn];

	if (player === currentTurn) {
		let bestScore = Number.MIN_SAFE_INTEGER;

		for (let i = 0; i < listOfMoves.length; ++i) {
			// Modify the Game Board with the move
			game[listOfMoves[i][0]] = currentTurn;
			RotateBoard(game, listOfMoves[i][1], listOfMoves[i][2]);
			let evaluationOfMove = Search(game, depth - 1, player, nextTurn, alpha, beta);

			// Undo the move from Game Board
			RotateBoard(game, listOfMoves[i][1], !listOfMoves[i][2]);
			game[listOfMoves[i][0]] = PIECES.EMPTY;

			if (depth === originalDepth) {
				depthOneResults.push([JSON.parse(JSON.stringify(listOfMoves[i])), evaluationOfMove]);
			}

			if (depth === originalDepth && evaluationOfMove > bestScore) bestIndex = listOfMoves[i];
			bestScore = Math.max(bestScore, evaluationOfMove);

			if (bestScore >= beta) break;

			alpha = Math.max(alpha, bestScore);
		}

		// SearchResultsMap.set(gameKey, bestScore);
		return bestScore;
	} else {
		let bestScore = Number.MAX_SAFE_INTEGER;

		for (let i = 0; i < listOfMoves.length; ++i) {
			// Modify the Game Board with the move
			game[listOfMoves[i][0]] = currentTurn;
			RotateBoard(game, listOfMoves[i][1], listOfMoves[i][2]);

			let evaluationOfMove = Search(game, depth - 1, player, nextTurn, alpha, beta);

			// Undo the move from Game Board
			RotateBoard(game, listOfMoves[i][1], !listOfMoves[i][2]);
			game[listOfMoves[i][0]] = PIECES.EMPTY;

			bestScore = Math.min(bestScore, evaluationOfMove); // Min here because we assume opponent chooses best possible move

			if (bestScore <= alpha) break;

			beta = Math.min(beta, bestScore);
		}

		// SearchResultsMap.set(gameKey, bestScore);
		return bestScore;
	}
}

function GetEmptyIndices(game, targetColor) {
	let emptyIndexList = [];
	let defendMoveList = [];
	let attackMoveList = [];
	let badDefendMovesList = [];
	let badAttackMovesList = [];

	// let quadrantsChosen = 0;
	let indexScoreLookup = {};
	let defendMoveScoreLookup = {};
	let attackMoveScoreLookup = {};

	// Check if the current player is being forced to make a move (we don't know where though).
	let isPlayerForcedToBlockWin = ForcedMoveToPreventWin(game, targetColor);
	let isPlayerForcedToStopFourInARow = ForcedMoveToStopFourInARowWithOpenEnds(game, targetColor);
	let isPlayerCurrentlyAboutToForceFourInARow = ForcedMoveToStopFourInARowWithOpenEnds(game, OTHER_PLAYER_LOOKUP[targetColor]);

	let rotationScores = [];

	let originalScore = Evaluate(game, targetColor);
	let evalScore = 0;

	// Determine which rotation is likely to be best
	for (let i = 0; i < 8; ++i) {
		RotateBoard(game, i % 4, (i > 3));

		// Only include the rotation if it doesn't make the player lose, or get into a losing position (4 in a row with open ends)
		evalScore = Evaluate(game, targetColor);
		if (evalScore > -10000) rotationScores.push([i, evalScore]);

		RotateBoard(game, i % 4, !(i > 3));
	}

	rotationScores.sort((a, b) => a[1] > b[1] ? -1 : 1);


	for (let i = 0; i < game.length; ++i) {
		if (game[i] !== PIECES.EMPTY) continue;
		indexScoreLookup[i] = CountColorsOnRowColDiag(game, i, targetColor);

		game[i] = targetColor;
		let arrayToUse;

		// Check if we need to defend
		if (isPlayerForcedToBlockWin || (isPlayerForcedToStopFourInARow && !isPlayerCurrentlyAboutToForceFourInARow)) {
			// Check if placing a piece in this empty cell will stop the forced move.
			if (!IsForcedMoveForPlayer(game, targetColor)) {
				// The move was the forced move
				defendMoveScoreLookup[i] = Evaluate(game, targetColor) - originalScore;

				if (defendMoveScoreLookup[i] < 0) {
					arrayToUse = badDefendMovesList;
				} else {
					arrayToUse = defendMoveList;
				}
			} else {
				arrayToUse = emptyIndexList;
			}

			for (let rs = 0; rs < rotationScores.length; ++rs) {
				arrayToUse.push([i, rotationScores[rs][0] % 4, rotationScores[rs][0] > 3]);
			}
		} else if (isPlayerCurrentlyAboutToForceFourInARow) {
			// Check if the move will create an Attack (forced move) for the opponent
			if (ForcedMoveToPreventWin(game, OTHER_PLAYER_LOOKUP[targetColor])) {
				// Forced Moved created
				attackMoveScoreLookup[i] = Evaluate(game, targetColor) - originalScore;

				if (attackMoveScoreLookup[i] < 0) {
					arrayToUse = badAttackMovesList;
				} else {
					arrayToUse = attackMoveList;
				}
			} else {
				// No Forced Moved created
				arrayToUse = emptyIndexList;
			}

			for (let rs = 0; rs < rotationScores.length; ++rs) {
				arrayToUse.push([i, rotationScores[rs][0] % 4, rotationScores[rs][0] > 3]);
			}
		} else {
			// Check if the move will create an Attack (forced move) for the opponent
			if (ForcedMoveToStopFourInARowWithOpenEnds(game, OTHER_PLAYER_LOOKUP[targetColor])) {
				// Forced Moved created
				attackMoveScoreLookup[i] = Evaluate(game, targetColor) - originalScore;

				if (attackMoveScoreLookup[i] < 0) {
					arrayToUse = badAttackMovesList;
				} else {
					arrayToUse = attackMoveList;
				}
			} else {
				// No Forced Moved created
				arrayToUse = emptyIndexList;
			}

			for (let rs = 0; rs < rotationScores.length; ++rs) {
				arrayToUse.push([i, rotationScores[rs][0] % 4, rotationScores[rs][0] > 3]);
			}
		}
		game[i] = PIECES.EMPTY;
	}

	// Sort Normal Moves
	emptyIndexList.sort((a, b) => {
		if (a[0] === b[0]) return 0;
		return indexScoreLookup[a[0]] > indexScoreLookup[b[0]] ? -1 : 1;
	});

	// Sort Attack Moves
	attackMoveList.sort((a, b) => {
		if (a[0] === b[0]) return 0;
		return attackMoveScoreLookup[a[0]] > attackMoveScoreLookup[b[0]] ? -1 : 1;
	});

	// Sort Bad Attack Moves
	badAttackMovesList.sort((a, b) => {
		if (a[0] === b[0]) return 0;
		return attackMoveScoreLookup[a[0]] > attackMoveScoreLookup[b[0]] ? -1 : 1;
	});

	// Sort Defend Moves
	defendMoveList.sort((a, b) => {
		if (a[0] === b[0]) return 0;
		return defendMoveScoreLookup[a[0]] > defendMoveScoreLookup[b[0]] ? -1 : 1;
	});

	// Sort Bad Defend Moves
	badDefendMovesList.sort((a, b) => {
		if (a[0] === b[0]) return 0;
		return defendMoveScoreLookup[a[0]] > defendMoveScoreLookup[b[0]] ? -1 : 1;
	});

	let newList = [...defendMoveList, ...attackMoveList, ...emptyIndexList, ...badAttackMovesList, ...badDefendMovesList];

	return newList;
}

module.exports = SearchAux;