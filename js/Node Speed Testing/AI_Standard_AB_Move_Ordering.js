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
		depthOneResults.sort((a, b) => a.score < b.score ? 1 : -1);
		iterativeDeepening = depthOneResults.map(x => x.move);
		// console.log(depthOneResults);
		// console.log(iterativeDeepening);
		depthOneResults = [];


		if (depth > GamePieces.filter(x => x === PIECES.EMPTY).length) break; 
	}

	return bestIndex;
}

let depthOneResults = [];

function Search(game, depth, player, currentTurn, alpha, beta) {
	searchCalls += 1n;

	let currentGameScore = Evaluate(game, player);
	// console.log({currentGameScore});
	// process.exit(123);

	if (depth <= 0 || currentGameScore === Number.MAX_SAFE_INTEGER || currentGameScore === Number.MIN_SAFE_INTEGER) return currentGameScore;

	// Get the list of valid moves that can be performed
	let listOfMoves = GetEmptyIndices(game, currentTurn);
	if (listOfMoves.length === 0) return currentGameScore;

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
				depthOneResults.push({
					move: JSON.stringify(listOfMoves[i]),
					score: evaluationOfMove,
					board: ConvertGameArrayToBigInt(game),
				});
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

			let evaluationOfMove = Search(game, depth - 1, player, nextTurn, alpha, beta);

			// Undo the move from Game Board
			RotateBoard(game, listOfMoves[i][1], !listOfMoves[i][2]);
			game[listOfMoves[i][0]] = PIECES.EMPTY;

			bestScore = Math.min(bestScore, evaluationOfMove); // Min here because we assume opponent chooses best possible move

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

	// let quadrantsChosen = 0;
	let indexScoreLookup = {};
	let defendMoveScoreLookup = {};
	let attackMoveScoreLookup = {};

	// Check if the current player is being forced to make a move (we don't know where though).
	// let isPlayerForcedToMove = IsForcedMoveForPlayer(game, targetColor);

	let isPlayerForcedToBlockWin = ForcedMoveToPreventWin(game, targetColor);
	let isPlayerForcedToStopFourInARow = ForcedMoveToStopFourInARowWithOpenEnds(game, targetColor);
	let isPlayerCurrentlyAboutToForceFourInARow = ForcedMoveToStopFourInARowWithOpenEnds(game, OTHER_PLAYER_LOOKUP[targetColor]);

	// console.log({ isPlayerForcedToBlockWin, isPlayerForcedToStopFourInARow, isPlayerCurrentlyAboutToForceFourInARow });

	// for (let i = 0; i < 8; ++i) {
	// 	Evaluate(game, targetColor);
	// }

	let rotationScores = [];
	// let rotationScoreLookup = {};

	let originalScore = Evaluate(game, targetColor);
	let evalScore = 0;

	// Determine which rotation is likely to be best
	for (let i = 0; i < 8; ++i) {
		RotateBoard(game, i%4, (i>3));

		// Only include the rotation if it doesn't make the player lose, or get into a losing position (4 in a row with open ends)
		evalScore = Evaluate(game, targetColor);
		if (evalScore > -10000) rotationScores.push([i, evalScore]);

		RotateBoard(game, i%4, !(i>3));
	}

	rotationScores.sort((a,b) => a[1] > b[1] ? -1 : 1);
	// console.log(rotationScores.map(x => [
	// 	[x[0]%4, x[0]>3], x[1]
	// ]));
	// console.log(rotationScoreLookup);


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
				arrayToUse.push([i, rotationScores[rs][0]%4, rotationScores[rs][0]>3]);
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


	// console.log('attackMoveList', attackMoveList);
	// console.log('defendMoveList', defendMoveList);
	// console.log('badAttackMovesList', badAttackMovesList);
	// console.log('badDefendMovesList', badDefendMovesList);
	// console.log('emptyIndexList', emptyIndexList);
	// console.log('attackMoveScoreLookup', attackMoveScoreLookup);
	// console.log('defendMoveScoreLookup', defendMoveScoreLookup);
	// process.exit(0);

	// if (badDefendMovesList.length > 0 || badAttackMovesList.length > 0) {

	// }

	let newList = [...defendMoveList, ...attackMoveList, ...emptyIndexList, ...badAttackMovesList, ...badDefendMovesList];

	return newList;
}

// function GetEmptyIndices(game, targetColor) {
// 	let emptyIndexList = [];
// 	// let quadrantsChosen = 0;
// 	let indexScoreLookup = {};

// 	let rotationScores = [];
// 	// let rotationScoreLookup = {};

// 	// Determine which rotation is likely to be best
// 	for (let i = 0; i < 8; ++i) {
// 		RotateBoard(game, i%4, (i>3));
// 		rotationScores.push([i, Evaluate(game, targetColor)]);
// 		// rotationScoreLookup[i] = Evaluate(game, targetColor);
// 		RotateBoard(game, i%4, !(i>3));
// 	}


// 	rotationScores.sort((a,b) => a[1] > b[1] ? -1 : 1);
// 	// console.log(rotationScores.map(x => [
// 	// 	[x[0]%4, x[0]>3], x[1]
// 	// ]));
// 	// console.log(rotationScoreLookup);

// 	for (let i = 0; i < game.length; ++i) {
// 		if (game[i] !== PIECES.EMPTY) continue;

// 		indexScoreLookup[i] = CountColorsOnRowColDiag(game, i, targetColor);

// 		emptyIndexList.push([i, rotationScores[0][0]%4, rotationScores[0][0]>3]);
// 		emptyIndexList.push([i, rotationScores[1][0]%4, rotationScores[1][0]>3]);
// 		emptyIndexList.push([i, rotationScores[2][0]%4, rotationScores[2][0]>3]);
// 		emptyIndexList.push([i, rotationScores[3][0]%4, rotationScores[3][0]>3]);
// 		emptyIndexList.push([i, rotationScores[4][0]%4, rotationScores[4][0]>3]);
// 		emptyIndexList.push([i, rotationScores[5][0]%4, rotationScores[5][0]>3]);
// 		emptyIndexList.push([i, rotationScores[6][0]%4, rotationScores[6][0]>3]);
// 		emptyIndexList.push([i, rotationScores[7][0]%4, rotationScores[7][0]>3]);

// 		// emptyIndexList.push([i, 0, true]);
// 		// emptyIndexList.push([i, 0, false]);
// 		// emptyIndexList.push([i, 1, true]);
// 		// emptyIndexList.push([i, 1, false]);
// 		// emptyIndexList.push([i, 2, true]);
// 		// emptyIndexList.push([i, 2, false]);
// 		// emptyIndexList.push([i, 3, true]);
// 		// emptyIndexList.push([i, 3, false]);

// 		// if (!QuadrantSymmetricWithPiece(game, i, 0)) {
// 		// 	emptyIndexList.push([i, 0, true]);
// 		// 	emptyIndexList.push([i, 0, false]);
// 		// 	++quadrantsChosen;
// 		// }

// 		// if (!QuadrantSymmetricWithPiece(game, i, 1)) {
// 		// 	emptyIndexList.push([i, 1, false]);
// 		// 	emptyIndexList.push([i, 1, true]);
// 		// 	++quadrantsChosen;
// 		// }

// 		// if (!QuadrantSymmetricWithPiece(game, i, 2)) {
// 		// 	emptyIndexList.push([i, 2, false]);
// 		// 	emptyIndexList.push([i, 2, true]);
// 		// 	++quadrantsChosen;
// 		// }

// 		// if (!QuadrantSymmetricWithPiece(game, i, 3)) {
// 		// 	emptyIndexList.push([i, 3, false]);
// 		// 	emptyIndexList.push([i, 3, true]);
// 		// 	++quadrantsChosen;
// 		// }

// 		// if (quadrantsChosen === 0) emptyIndexList.push([i, 0, false]);
// 	}

// 	emptyIndexList.sort((a, b) => {
// 		if (a[0] === b[0]) return 0;

// 		return indexScoreLookup[a[0]] > indexScoreLookup[b[0]] ? -1 : 1;
// 	});

// 	// emptyIndexList.sort((a, b) => {
// 	// 	if (a[0] !== b[0]) return 0;		
// 	// 	return rotationScoreLookup[a[1] + (a[2] ? 4 : 0)] > rotationScoreLookup[b[1] + (b[2] ? 4 : 0)] ? -1 : 1;
// 	// });

// 	// console.log(emptyIndexList);
// 	// process.exit(1);

// 	return emptyIndexList;
// }

// function GetEmptyIndices(game, targetColor) {
// 	let emptyIndexList = [];
// 	let quadrantsChosen = 0;
// 	let indexScoreLookup = {};

// 	for (let i = 0; i < game.length; ++i) {
// 		if (game[i] !== PIECES.EMPTY) continue;
// 		// game[i] = targetColor;
// 		indexScoreLookup[i] = CountColorsOnRowColDiag(game, i, targetColor);
// 		// indexScoreLookup[i] = Evaluate(game, targetColor);
// 		// game[i] = PIECES.EMPTY;

// 		if (!QuadrantSymmetricWithPiece(game, i, 0)) {
// 			emptyIndexList.push([i, 0, true]);
// 			emptyIndexList.push([i, 0, false]);
// 			++quadrantsChosen;
// 		}

// 		if (!QuadrantSymmetricWithPiece(game, i, 1)) {
// 			emptyIndexList.push([i, 1, false]);
// 			emptyIndexList.push([i, 1, true]);
// 			++quadrantsChosen;
// 		}

// 		if (!QuadrantSymmetricWithPiece(game, i, 2)) {
// 			emptyIndexList.push([i, 2, false]);
// 			emptyIndexList.push([i, 2, true]);
// 			++quadrantsChosen;
// 		}

// 		if (!QuadrantSymmetricWithPiece(game, i, 3)) {
// 			emptyIndexList.push([i, 3, false]);
// 			emptyIndexList.push([i, 3, true]);
// 			++quadrantsChosen;
// 		}

// 		if (quadrantsChosen === 0) emptyIndexList.push([i, 0, false]);
// 	}

// 	emptyIndexList.sort((a, b) => {
// 		return indexScoreLookup[a[0]] > indexScoreLookup[b[0]] ? -1 : 1;
// 	});

// 	return emptyIndexList;
// }

module.exports = SearchAux;