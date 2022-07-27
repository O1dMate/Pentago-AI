const { PrettyResult, RotateBoard, Evaluate, CountColorsOnRowColDiag, IsForcedMoveForPlayer, ForcedMoveToStopFourInARowWithOpenEnds, ForcedMoveToPreventWin } = require('./AI_Common_Functions');

let SEARCH_DEPTH;
let PIECES = { 'EMPTY': -1, 'BLACK': 0, 'WHITE': 1 };
const OTHER_PLAYER_LOOKUP = { [PIECES.WHITE]: PIECES.BLACK, [PIECES.BLACK]: PIECES.WHITE };

let originalDepth = 1;
let bestIndex = -1;
let iterativeDeepening = [];
let searchCalls = 0n;

const PIECES_BINARY_INT_VALUES = { EMPTY: 0n, BLACK: 1n, WHITE: 2n }; // Leave as is!!!

function ConvertGameArrayToBigInt(game) {

	let gameAsBigInt = (game[0] === PIECES.BLACK ? PIECES_BINARY_INT_VALUES.BLACK : game[0] === PIECES.WHITE ? PIECES_BINARY_INT_VALUES.WHITE : 0n);

	for (let i = 1; i < 36; ++i) {
		gameAsBigInt = gameAsBigInt << 2n;
		if (game[i] === PIECES.BLACK) gameAsBigInt = gameAsBigInt | PIECES_BINARY_INT_VALUES.BLACK;
		else if (game[i] === PIECES.WHITE) gameAsBigInt = gameAsBigInt | PIECES_BINARY_INT_VALUES.WHITE;
	}

	return gameAsBigInt;
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

		depthOneResults.sort((a, b) => a.score < b.score ? 1 : -1);
		let searchCallsStr = new Intl.NumberFormat('en-AU').format(searchCalls.toString());

		if (result === Number.MIN_SAFE_INTEGER) {
			console.log(`Depth (${depth}), AI will LOSE:`, PrettyResult(bestIndex), `Calls (${searchCallsStr})`, `msTime (${depthTime})`);
			break;
		}

		if (result === Number.MAX_SAFE_INTEGER) {
			console.log(`Depth (${depth}), Winning Move:`, PrettyResult(bestIndex), `Calls (${searchCallsStr})`, `msTime (${depthTime})`);
			depthOneResults.forEach(a => console.log(a));
			break;
		}

		console.log(`Depth (${depth}), Score (${result})`, PrettyResult(bestIndex), `Calls (${searchCallsStr})`, `msTime (${depthTime})`);
		// console.log(depthOneResults);
		// depthOneResults.forEach(a => console.log(a));

		// Store all the initial moves that will lead to a loss. These moves will not be played.
		depthOneResults.forEach(move => {
			if (move.score === Number.MIN_SAFE_INTEGER) depthOneMovesToAvoid[move.move] = true;
		});

		depth++;
		iterativeDeepening = depthOneResults.map(x => x.move);
		depthOneResults = [];

		if (depth > GamePieces.filter(x => x === PIECES.EMPTY).length) break;
	}

	return bestIndex;
}

let depthOneResults = [];
let depthOneMovesToAvoid = {};

function Search(game, depth, player, currentTurn, alpha, beta) {
	searchCalls += 1n;

	let currentGameScore = Evaluate(game, player);

	if (depth <= 0 || currentGameScore === Number.MAX_SAFE_INTEGER || currentGameScore === Number.MIN_SAFE_INTEGER) return currentGameScore;

	// Get the list of valid moves that can be performed
	let listOfMoves = GetEmptyIndices(game, currentTurn);
	if (listOfMoves.length === 0) return currentGameScore;

	let nextTurn = OTHER_PLAYER_LOOKUP[currentTurn];

	if (player === currentTurn) {
		let bestScore = Number.MIN_SAFE_INTEGER;

		// If we are at the first move, and we know that the move will lead to a loss, don't explore at the move at all.
		if (depth === originalDepth) {
			// Remove all the moves that we know will lead to a loss.
			listOfMoves = listOfMoves.filter(move => !depthOneMovesToAvoid.hasOwnProperty(JSON.stringify(move)));
		}

		for (let i = 0; i < listOfMoves.length; ++i) {
			// Modify the Game Board with the move
			game[listOfMoves[i][0]] = currentTurn;
			RotateBoard(game, listOfMoves[i][1], listOfMoves[i][2]);

			let evaluationOfMove = Search(game, depth - 1, player, nextTurn, alpha, beta);

			// Undo the move from Game Board
			RotateBoard(game, listOfMoves[i][1], !listOfMoves[i][2]);
			game[listOfMoves[i][0]] = PIECES.EMPTY;

			if (depth === originalDepth) {
				depthOneResults.push({
					move: JSON.stringify(listOfMoves[i]),
					score: evaluationOfMove
				});
			}

			if (depth === originalDepth && evaluationOfMove > bestScore) bestIndex = listOfMoves[i];
			bestScore = Math.max(bestScore, evaluationOfMove);

			// α+β pruning
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

			let evaluationOfMove = Search(game, depth - 1, player, nextTurn, alpha, beta);

			// Undo the move from Game Board
			RotateBoard(game, listOfMoves[i][1], !listOfMoves[i][2]);
			game[listOfMoves[i][0]] = PIECES.EMPTY;

			bestScore = Math.min(bestScore, evaluationOfMove); // Min here because we assume opponent chooses best possible move

			// α+β pruning
			if (bestScore <= alpha) break;
			beta = Math.min(beta, bestScore);
		}

		return bestScore;
	}
}

function GetEmptyIndices(game, targetColor) {
	let emptyIndexList = [];
	let defendMoveList = [];
	let attackMoveList = [];
	let badDefendMovesList = [];
	let badAttackMovesList = [];

	let indexScoreLookup = {};
	let defendMoveScoreLookup = {};
	let attackMoveScoreLookup = {};

	// Check if the current player is being forced to make a move (we don't know where though).
	let isPlayerForcedToBlockWin = ForcedMoveToPreventWin(game, targetColor);
	let isPlayerForcedToStopFourInARow = ForcedMoveToStopFourInARowWithOpenEnds(game, targetColor);
	let isPlayerCurrentlyAboutToForceFourInARow = ForcedMoveToStopFourInARowWithOpenEnds(game, OTHER_PLAYER_LOOKUP[targetColor]);

	// let rotationScores = [];

	let originalScore = Evaluate(game, targetColor);
	// let evalScore = 0;

	// // Determine which rotation is likely to be best
	// for (let i = 0; i < 8; ++i) {
	// 	RotateBoard(game, i % 4, (i > 3));

	// 	// Only include the rotation if it doesn't make the player lose, or get into a losing position (4 in a row with open ends)
	// 	evalScore = Evaluate(game, targetColor);
	// 	// if (evalScore - originalScore > 50) rotationScores.push([i, evalScore]);
	// 	rotationScores.push([i, evalScore]);
	// 	// if (evalScore - originalScore > 50) rotationScores.push([i, evalScore]);
	// 	// if (evalScore > originalScore) rotationScores.push([i, evalScore]);

	// 	RotateBoard(game, i % 4, !(i > 3));
	// }

	// if (rotationScores.length === 0) {
	// 	for (let i = 0; i < 8; ++i) {
	// 		RotateBoard(game, i % 4, (i > 3));
	// 		rotationScores.push([i, Evaluate(game, targetColor)]);
	// 		RotateBoard(game, i % 4, !(i > 3));
	// 	}
	// }

	// rotationScores.sort((a, b) => a[1] > b[1] ? -1 : 1);

	for (let i = 0; i < game.length; ++i) {
		if (game[i] !== PIECES.EMPTY) continue;

		for (let rot = 0; rot < 8; rot++) {
			indexScoreLookup[i] = CountColorsOnRowColDiag(game, i, targetColor);
			
			game[i] = targetColor;
			RotateBoard(game, rot % 4, (rot > 3));
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
			}
			arrayToUse.push([i, rot % 4, (rot > 3)]);
			// for (let rs = 0; rs < rotationScores.length; ++rs) {
			// 	arrayToUse.push([i, rotationScores[rs][0] % 4, rotationScores[rs][0] > 3]);
			// }
			RotateBoard(game, rot % 4, !(rot > 3));
			game[i] = PIECES.EMPTY;
		}
	}

	// // Sort Normal Moves
	// emptyIndexList.sort((a, b) => {
	// 	if (a[0] === b[0]) return 0;
	// 	return indexScoreLookup[a[0]] > indexScoreLookup[b[0]] ? -1 : 1;
	// });

	// // Sort Attack Moves
	// attackMoveList.sort((a, b) => {
	// 	if (a[0] === b[0]) return 0;
	// 	return attackMoveScoreLookup[a[0]] > attackMoveScoreLookup[b[0]] ? -1 : 1;
	// });

	// // Sort Bad Attack Moves
	// badAttackMovesList.sort((a, b) => {
	// 	if (a[0] === b[0]) return 0;
	// 	return attackMoveScoreLookup[a[0]] > attackMoveScoreLookup[b[0]] ? -1 : 1;
	// });

	// // Sort Defend Moves
	// defendMoveList.sort((a, b) => {
	// 	if (a[0] === b[0]) return 0;
	// 	return defendMoveScoreLookup[a[0]] > defendMoveScoreLookup[b[0]] ? -1 : 1;
	// });

	// // Sort Bad Defend Moves
	// badDefendMovesList.sort((a, b) => {
	// 	if (a[0] === b[0]) return 0;
	// 	return defendMoveScoreLookup[a[0]] > defendMoveScoreLookup[b[0]] ? -1 : 1;
	// });

	if (defendMoveList.length > 0) return defendMoveList;
	else if (attackMoveList.length > 0) return attackMoveList;
	else return [...defendMoveList, ...attackMoveList, ...emptyIndexList, ...badAttackMovesList, ...badDefendMovesList];

	// let newList = [...defendMoveList, ...attackMoveList, ...emptyIndexList, ...badAttackMovesList, ...badDefendMovesList];
	// return newList;
}

module.exports = SearchAux;