const { PrettyResult, QuadrantSymmetricWithPiece, RotateBoard, Evaluate, CountColorsOnRowColDiag } = require('./AI_Common_Functions');

let SEARCH_DEPTH;
let PIECES = { 'EMPTY': -1, 'BLACK': 0, 'WHITE': 1 };

let originalDepth = 1;
let bestIndex = -1;
let iterativeDeepening = null;
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
			console.log("AI Winning Move:", PrettyResult(bestIndex));
			break;
		}

		iterativeDeepening = bestIndex[0];
		console.log(`Depth (${depth}), Score (${result})`, PrettyResult(bestIndex), `Calls (${searchCalls})`, `msTime (${depthTime})`);
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
		emptyIndexList.sort((a,b) => {
		 	if (a[0] !== iterativeDeepening && b[0] !== iterativeDeepening) return 0;
			return a[0] === iterativeDeepening ? -1 : b[0] === iterativeDeepening ? 1 : 0;
		});

		iterativeDeepening = null;
	} else {
		emptyIndexList.sort((a,b) => {
			return indexScoreLookup[a[0]] > indexScoreLookup[b[0]] ? -1 : 1;
		});
	}

	return emptyIndexList;
}


// function GetEmptyIndices(game, targetColor) {
// 	let emptyIndexList = [];
// 	let quadrantsChosen = 0;
// 	// let indexScoreLookup = {};

// 	let Q1s = QuadrantSymmetricWithPiece(game, 7, 0);
// 	let Q2s = QuadrantSymmetricWithPiece(game, 10, 1);
// 	let Q3s = QuadrantSymmetricWithPiece(game, 25, 2);
// 	let Q4s = QuadrantSymmetricWithPiece(game, 28, 3);

// 	let leftScore = 0;
// 	let rightScore = 0;
// 	let bestScoreSoFar = 0;

// 	for (let i = 0; i < game.length; ++i) {
// 		if (game[i] !== PIECES.EMPTY) continue;
// 		if (Q1s && QUADRANT0_SYMMETRY_IGNORE[i]) continue;
// 		if (Q2s && QUADRANT1_SYMMETRY_IGNORE[i]) continue;
// 		if (Q3s && QUADRANT2_SYMMETRY_IGNORE[i]) continue;
// 		if (Q4s && QUADRANT3_SYMMETRY_IGNORE[i]) continue;

// 		quadrantsChosen = 0;

// 		if (!Q1s || !QuadrantSymmetricWithPiece(game, i, 0)) {
// 			leftScore = CountColorsOnRowColDiagV2(game, [i, 0, false], targetColor);
// 			rightScore = CountColorsOnRowColDiagV2(game, [i, 0, true], targetColor);

// 			if (leftScore > bestScoreSoFar) {
// 				emptyIndexList.unshift([i, 0, false]);
// 				emptyIndexList.push([i, 0, true]);
// 				bestScoreSoFar = leftScore;
// 			}
// 			else if (rightScore > bestScoreSoFar) {
// 				emptyIndexList.push([i, 0, false]);
// 				emptyIndexList.unshift([i, 0, true]);
// 				bestScoreSoFar = rightScore;
// 			}
// 			else {
// 				emptyIndexList.push([i, 0, false]);
// 				emptyIndexList.push([i, 0, true]);
// 			}
// 			++quadrantsChosen;
// 		}

// 		if (!Q2s || !QuadrantSymmetricWithPiece(game, i, 1)) {
// 			leftScore = CountColorsOnRowColDiagV2(game, [i, 1, false], targetColor);
// 			rightScore = CountColorsOnRowColDiagV2(game, [i, 1, true], targetColor);

// 			if (leftScore > bestScoreSoFar) {
// 				emptyIndexList.unshift([i, 1, false]);
// 				emptyIndexList.push([i, 1, true]);
// 				bestScoreSoFar = leftScore;
// 			}
// 			else if (rightScore > bestScoreSoFar) {
// 				emptyIndexList.push([i, 1, false]);
// 				emptyIndexList.unshift([i, 1, true]);
// 				bestScoreSoFar = rightScore;
// 			}
// 			else {
// 				emptyIndexList.push([i, 1, false]);
// 				emptyIndexList.push([i, 1, true]);
// 			}
// 			++quadrantsChosen;
// 		}

// 		if (!Q3s || !QuadrantSymmetricWithPiece(game, i, 2)) {
// 			leftScore = CountColorsOnRowColDiagV2(game, [i, 2, false], targetColor);
// 			rightScore = CountColorsOnRowColDiagV2(game, [i, 2, true], targetColor);

// 			if (leftScore > bestScoreSoFar) {
// 				emptyIndexList.unshift([i, 2, false]);
// 				emptyIndexList.push([i, 2, true]);
// 				bestScoreSoFar = leftScore;
// 			}
// 			else if (rightScore > bestScoreSoFar) {
// 				emptyIndexList.push([i, 2, false]);
// 				emptyIndexList.unshift([i, 2, true]);
// 				bestScoreSoFar = rightScore;
// 			}
// 			else {
// 				emptyIndexList.push([i, 2, false]);
// 				emptyIndexList.push([i, 2, true]);
// 			}
// 			++quadrantsChosen;
// 		}

// 		if (!Q4s || !QuadrantSymmetricWithPiece(game, i, 3)) {
// 			leftScore = CountColorsOnRowColDiagV2(game, [i, 3, false], targetColor);
// 			rightScore = CountColorsOnRowColDiagV2(game, [i, 3, true], targetColor);

// 			if (leftScore > bestScoreSoFar) {
// 				emptyIndexList.unshift([i, 3, false]);
// 				emptyIndexList.push([i, 3, true]);
// 				bestScoreSoFar = leftScore;
// 			}
// 			else if (rightScore > bestScoreSoFar) {
// 				emptyIndexList.push([i, 3, false]);
// 				emptyIndexList.unshift([i, 3, true]);
// 				bestScoreSoFar = rightScore;
// 			}
// 			else {
// 				emptyIndexList.push([i, 3, false]);
// 				emptyIndexList.push([i, 3, true]);
// 			}
// 			++quadrantsChosen;
// 		}

// 		if (quadrantsChosen === 0) {
// 			emptyIndexList.push([i, 0, false]);
// 		}
// 	}

// 	if (iterativeDeepening) {
// 		emptyIndexList.sort((a, b) => {
// 			if (a[0] !== iterativeDeepening && b[0] !== iterativeDeepening) {
// 				let scoreA = CountColorsOnRowColDiagV2(game, a, targetColor);
// 				let scoreB = CountColorsOnRowColDiagV2(game, b, targetColor);
// 				return scoreA > scoreB ? -1 : 1;
// 			}
// 			return a[0] === iterativeDeepening ? -1 : b[0] === iterativeDeepening ? 1 : 0;
// 		});

// 		iterativeDeepening = null;
// 	}
// 	// else {
// 	// 	if (Math.abs(originalDepth - depth) < STRONG_SEARCH_DEPTH) {
// 	// 		emptyIndexList.sort((a, b) => {
// 	// 			let scoreA = CountColorsOnRowColDiagV2(game, a, targetColor);
// 	// 			let scoreB = CountColorsOnRowColDiagV2(game, b, targetColor);
// 	// 			return scoreA > scoreB ? -1 : 1;
// 	// 		});
// 	// 	}
// 	// }

// 	return emptyIndexList;
// }

module.exports = SearchAux;