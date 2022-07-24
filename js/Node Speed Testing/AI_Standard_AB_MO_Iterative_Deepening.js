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
	// let resultMoveList;

	while (depth <= SEARCH_DEPTH) {
		searchCalls = 0n;
		originalDepth = depth;

		depthTime = Date.now();
		result = Search(GamePieces, depth, currentTurn, currentTurn, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, []);
		depthTime = Date.now() - depthTime;

		// resultMoveList = result[1];
		// result = result[0];

		if (depth === 1 && result === Number.MIN_SAFE_INTEGER) {
			console.log('AI LOST!!!');
			break;
		}

		if (result === Number.MAX_SAFE_INTEGER) {
			console.log(`Depth (${depth}), Winning Move:`, PrettyResult(bestIndex), `Calls (${searchCalls})`, `msTime (${depthTime})`);
			break;
		}
		console.log(`Depth (${depth}), Score (${result})`, PrettyResult(bestIndex), `Calls (${searchCalls})`, `msTime (${depthTime})`);
		depthOneResults.sort((a,b) => a[1] < b[1] ? 1 : -1);
		iterativeDeepening = depthOneResults.map(x => JSON.stringify(x[0]));

		depthOneResults = [];
		depth++;

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

	let listOfMoves = GetEmptyIndices(game, currentTurn);

	if (listOfMoves.length === 0) return currentGameScore;

	let nextTurn = currentTurn === PIECES.BLACK ? PIECES.WHITE : PIECES.BLACK;
	let bestScore;
	// let bestMoveList;
	let evaluationOfMove;

	if (player === currentTurn) {
		bestScore = Number.MIN_SAFE_INTEGER;

		for (let i = 0; i < listOfMoves.length; ++i) {
			// Modify the Game Board with the move
			game[listOfMoves[i][0]] = currentTurn;
			RotateBoard(game, listOfMoves[i][1], listOfMoves[i][2]);

			evaluationOfMove = Search(game, depth-1, player, nextTurn, alpha, beta);

			// if (evaluationOfMove === Number.MAX_SAFE_INTEGER) return Number.MAX_SAFE_INTEGER;

			// Undo the move from Game Board
			RotateBoard(game, listOfMoves[i][1], !listOfMoves[i][2]);
			game[listOfMoves[i][0]] = -1;
			
			if (depth === originalDepth) {
				depthOneResults.push([JSON.parse(JSON.stringify(listOfMoves[i])), evaluationOfMove]);
			}

			if (depth === originalDepth && evaluationOfMove > bestScore) {
				bestIndex = listOfMoves[i];
			}
			bestScore = Math.max(bestScore, evaluationOfMove);
			
			if (bestScore >= beta) break;
			
			alpha = Math.max(alpha, bestScore);
		}

		return bestScore;
	} else {
		bestScore = Number.MAX_SAFE_INTEGER;

		for (let i = 0; i < listOfMoves.length; ++i) {
			// Modify the Game Board with the move
			game[listOfMoves[i][0]] = currentTurn;
			RotateBoard(game, listOfMoves[i][1], listOfMoves[i][2]);

			evaluationOfMove = Search(game, depth-1, player, nextTurn, alpha, beta);

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
	let indexScoreLookup = {};
	let quadrantsChosen = 0;
	
	for (let i = 0; i < game.length; ++i) {
		if (game[i] !== PIECES.EMPTY) continue;

		indexScoreLookup[i] = CountColorsOnRowColDiag(game, i, targetColor);
		quadrantsChosen = 0;

		for (let quadrant = 0; quadrant < 4; ++quadrant) {
			if (!QuadrantSymmetricWithPiece(game, i, quadrant)) {
				emptyIndexList.push([i, quadrant, false]);
				emptyIndexList.push([i, quadrant, true]);
				++quadrantsChosen;
			}
		}

		if (quadrantsChosen === 0) emptyIndexList.push([i, 0, false]);
	}

	if (iterativeDeepening) {
		emptyIndexList.sort((a,b) => {
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