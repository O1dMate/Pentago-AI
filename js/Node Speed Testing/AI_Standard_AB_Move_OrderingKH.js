const { PrettyResult, RotateBoard, Evaluate, CountColorsOnRowColDiag, IsForcedMoveForPlayer, ForcedMoveToStopFourInARowWithOpenEnds, ForcedMoveToPreventWin, NewIsForcedMoveForPlayer, NewIsForcedToPreventWin, NewIsForcedToPreventFourInARow, } = require('./AI_Common_Functions');

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
	let depth = SEARCH_DEPTH;
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
	let listOfMoves = GetEmptyIndices(game, currentTurn, currentGameScore);
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

function GetEmptyIndices(game, targetColor, originalScore) {
	let emptyIndexList = [];

	let attackMoveList = [];
	let badAttackMovesList = [];

	let defendMoveList = [];
	let badDefendMovesList = [];

	let indexScoreLookup = {};
	let scoreLookup = {};

	// Check if the current player is being forced to make a move (we don't know where though).
	let opponentHasFourInARow = NewIsForcedToPreventWin(game, targetColor);
	let opponentHasThreeInARow = NewIsForcedToPreventFourInARow(game, targetColor);
	let playerHasFourInARow = NewIsForcedToPreventWin(game, OTHER_PLAYER_LOOKUP[targetColor]);
	let playerHasThreeInARow = NewIsForcedToPreventFourInARow(game, OTHER_PLAYER_LOOKUP[targetColor]);

	let hasToDefendOne = opponentHasFourInARow && !playerHasFourInARow;
	let hasToDefendTwo = opponentHasThreeInARow && !playerHasThreeInARow;
	let hasToDefendThree = !(playerHasFourInARow && opponentHasThreeInARow);

	// console.log();
	// console.log({ opponentHasFourInARow, opponentHasThreeInARow });
	// console.log({ playerHasFourInARow, playerHasThreeInARow });
	// console.log();

	// let rotationScores = [];
	// let evalScore = 0;

	// // Determine which rotation is likely to be best
	// for (let i = 0; i < 8; ++i) {
	// 	RotateBoard(game, i % 4, (i > 3));

	// 	// Only include the rotation if it doesn't make the player lose, or get into a losing position (4 in a row with open ends)
	// 	evalScore = Evaluate(game, targetColor);
	// 	if (evalScore > -10000) rotationScores.push([i, evalScore]);

	// 	RotateBoard(game, i % 4, !(i > 3));
	// }

	// rotationScores.sort((a, b) => a[1] > b[1] ? -1 : 1);

	// let startBoard = game.toString();
	let foundWin = false;

	for (let i = 0; i < game.length; ++i) {
		if (game[i] !== PIECES.EMPTY) continue;

		game[i] = targetColor;

		for (let rotationDir = 0; rotationDir < 8; ++rotationDir) {
			RotateBoard(game, rotationDir % 4, (rotationDir > 3));

			// indexScoreLookup[i] = CountColorsOnRowColDiag(game, i, targetColor);

			let moveString = JSON.stringify([i, rotationDir % 4, (rotationDir > 3)]);
			scoreLookup[moveString] = Evaluate(game, targetColor) - originalScore;

			if (scoreLookup[moveString] > 1_000_000) foundWin = [i, rotationDir % 4, (rotationDir > 3)];

			let arrayToUse;

			// Check if we need to Defend
			// if ((opponentHasFourInARow && !playerHasFourInARow) || (opponentHasThreeInARow && !playerHasThreeInARow)) {
			if ((hasToDefendOne || hasToDefendTwo) && hasToDefendThree) {
				let opponentNowHasFourInARow = NewIsForcedToPreventWin(game, targetColor);
				let opponentNowHasThreeInARow = NewIsForcedToPreventFourInARow(game, targetColor);

				// Check if this move prevents the Attack
				if (!NewIsForcedMoveForPlayer(game, targetColor) || (opponentHasFourInARow && !opponentNowHasFourInARow) || (opponentHasThreeInARow && !opponentNowHasThreeInARow)) {
					arrayToUse = defendMoveList;
					// console.log('good def', opponentNowHasFourInARow, opponentNowHasThreeInARow, moveString, NewIsForcedMoveForPlayer(game, targetColor))
				} else {
					// The move didn't stop the opponents Attack.
					arrayToUse = badDefendMovesList;
					// console.log('bad def', opponentNowHasFourInARow, opponentNowHasThreeInARow, moveString, NewIsForcedMoveForPlayer(game, targetColor))
				}
			} else if (playerHasFourInARow || playerHasThreeInARow) {
				// Check if the move continues the Attack
				if (NewIsForcedToPreventWin(game, OTHER_PLAYER_LOOKUP[targetColor])) {
					arrayToUse = attackMoveList;
				} else {
					// The Move didn't further the attack (3 in-a-row to 4, 4 in-a-row to win).
					arrayToUse = badAttackMovesList;
				}
			} else {
				// Check if the move will create an Attack
				if (NewIsForcedToPreventFourInARow(game, OTHER_PLAYER_LOOKUP[targetColor])) {
					arrayToUse = attackMoveList;
				} else {
					// No Forced Moved created (doesn't mean it's a bad move, since it might not be possible)
					arrayToUse = emptyIndexList;
				}
			}

			arrayToUse.push([i, rotationDir % 4, (rotationDir > 3)]);

			RotateBoard(game, rotationDir % 4, !(rotationDir > 3));
		}
		game[i] = PIECES.EMPTY;
	}

	if (foundWin) return [foundWin];

	// Sort Normal Moves
	emptyIndexList.sort((a, b) => {
		// if (a[0] === b[0]) return 0;
		return scoreLookup[JSON.stringify(a)] > scoreLookup[JSON.stringify(b)] ? -1 : 1;
	});

	// Sort Attack Moves
	attackMoveList.sort((a, b) => {
		// if (a[0] === b[0]) return 0;
		return scoreLookup[JSON.stringify(a)] > scoreLookup[JSON.stringify(b)] ? -1 : 1;
	});

	// Sort Bad Attack Moves
	badAttackMovesList.sort((a, b) => {
		// if (a[0] === b[0]) return 0;
		return scoreLookup[JSON.stringify(a)] > scoreLookup[JSON.stringify(b)] ? -1 : 1;
	});

	// Sort Defend Moves
	defendMoveList.sort((a, b) => {
		// if (a[0] === b[0]) return 0;
		return scoreLookup[JSON.stringify(a)] > scoreLookup[JSON.stringify(b)] ? -1 : 1;
	});

	// Sort Bad Defend Moves
	badDefendMovesList.sort((a, b) => {
		// if (a[0] === b[0]) return 0;
		return scoreLookup[JSON.stringify(a)] > scoreLookup[JSON.stringify(b)] ? -1 : 1;
	});


	// if ((hasToDefendOne || hasToDefendTwo) && hasToDefendThree) {
	// if ((opponentHasFourInARow && !playerHasFourInARow) || (opponentHasThreeInARow && !playerHasThreeInARow)) {
	// if ((opponentHasFourInARow && !playerHasFourInARow) || (opponentHasThreeInARow && !playerHasThreeInARow)) {
	// 	if (defendMoveList.length === 0) {
	// 		console.log('TURN:', targetColor);
	// 		console.log(game.toString());
	// 		console.log('attackMoveList', attackMoveList);
	// 		console.log('badAttackMovesList', badAttackMovesList);

	// 		console.log('defendMoveList', defendMoveList);
	// 		console.log('badDefendMovesList', badDefendMovesList);

	// 		console.log('emptyIndexList', emptyIndexList);

	// 		console.log('scoreLookup', scoreLookup);
	// 		console.log();
	// 		console.log({ opponentHasFourInARow, opponentHasThreeInARow });
	// 		console.log({ playerHasFourInARow, playerHasThreeInARow });
	// 		console.log();
	// 		process.exit(123);
	// 	}
	// }


	// console.log('attackMoveList', attackMoveList);
	// console.log('badAttackMovesList', badAttackMovesList);

	// console.log('defendMoveList', defendMoveList);
	// console.log('badDefendMovesList', badDefendMovesList);

	// console.log('emptyIndexList', emptyIndexList);

	// console.log('scoreLookup', scoreLookup);
	// // console.log('attackMoveScoreLookup', attackMoveScoreLookup);
	// // console.log('defendMoveScoreLookup', defendMoveScoreLookup);
	// process.exit(0);


	// if (badDefendMovesList.length > 0 || badAttackMovesList.length > 0) {

	// }

	if (defendMoveList.length > 0) return [...defendMoveList, ...badDefendMovesList];
	else if (attackMoveList.length > 0) return [...attackMoveList, ...badAttackMovesList];
	return [...emptyIndexList, ...badAttackMovesList, ...badDefendMovesList];

	// let newList = [...defendMoveList, ...attackMoveList, ...emptyIndexList, ...badAttackMovesList, ...badDefendMovesList];

	// if (!called) {
	// 	called = true;
	// 	// console.log(startBoard);
	// 	// console.log(game.toString());
	// 	// console.log();
	// }
	// else {
	// 	// console.log(startBoard);
	// 	// console.log(game.toString());
	// 	// console.log(newList);
	// 	process.exit(123);
	// }
	// return newList;
}

module.exports = SearchAux;