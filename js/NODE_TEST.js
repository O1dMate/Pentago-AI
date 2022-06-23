let pairScore = 2; // Score for having two in a row
let tripletScore = 5; // Score for having three in a row
let quadScore = 10; // Score for having four in a row

let openEndPair = 3*pairScore; // Score for two in a row, but with an open end.
let openEndTriplet = 2.5*tripletScore; // Score for three in a row, but with an open end.
let openEndQuad = 3*quadScore; // Score for four in a row, but with an open end.

let doubleOpenEndPair = 3*openEndPair;
let doubleOpenEndTriplet = 2.5*openEndTriplet;
let doubleOpenEndQuad = 10*openEndQuad;

let PIECES = {'EMPTY': -1, 'BLACK': 0, 'WHITE': 1};
let TURN = {
	PLAYER: 0,
	AI: 1,
	PLAYER_COLOR: PIECES.BLACK,
	AI_COLOR: PIECES.WHITE
};
let CURRENT_TURN = TURN.AI;
let OTHER_PLAYER_LOOKUP = {[PIECES.WHITE]: PIECES.BLACK, [PIECES.BLACK]: PIECES.WHITE};

const GAME_STR_TO_USE = '';
const SEARCH_DEPTH = 15;
let STRONG_SEARCH_DEPTH = 0; // Bigger values take a lot longer at the start, but give quick results as the search gets deeper. (e.g. with a value of 3, search up to depth 3-4 will take much longer, but after it should be much faster)
STRONG_SEARCH_DEPTH = Math.min(SEARCH_DEPTH, STRONG_SEARCH_DEPTH);

// Track what piece is in each location (will be 36 elements long).
let GamePieces = [];

const ROW_INDICES = [[0,1,2,3,4,5],[6,7,8,9,10,11],[12,13,14,15,16,17],[18,19,20,21,22,23],[24,25,26,27,28,29],[30,31,32,33,34,35]];
const COL_INDICES = [[0,6,12,18,24,30],[1,7,13,19,25,31],[2,8,14,20,26,32],[3,9,15,21,27,33],[4,10,16,22,28,34],[5,11,17,23,29,35]];
const DIAGONAL_INDICES = [[6,13,20,27,34],[0,7,14,21,28,35],[1,8,15,22,29],[24,19,14,9,4],[30,25,20,15,10,5],[31,26,21,16,11]];
const DIAGONAL_INDICES_FROM_INDEX = [];
const SURROUNDING_INDICES = [];

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

	// let blackPieces = 2;
	// let whitePieces = 2;

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

	// console.log(GamePieces.toString());
	// GamePieces.forEach((x,index) => x !== PIECES.EMPTY && console.log(index));

	// TODO, depth 7+ after first move (13, q4, right)
	// GamePieces = '-1,-1,-1,-1,1,0,0,1,1,0,1,1,-1,-1,0,0,0,-1,0,1,1,0,1,-1,1,-1,0,1,0,-1,-1,0,-1,1,-1,-1'.split(',').map(x => parseInt(x));

	// GamePieces = '-1,-1,-1,0,1,-1,-1,0,1,1,0,0,0,1,1,1,0,1,1,0,-1,1,-1,0,0,0,0,1,1,-1,1,1,0,0,-1,-1'.split(',').map(x => parseInt(x));
	// GamePieces = '-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,1,-1,-1,-1,-1,-1,-1,-1,-1,-1,1,-1,-1,-1,-1,-1,-1,-1,0,-1,-1,-1,-1,0'.split(',').map(x => parseInt(x));

	if (GAME_STR_TO_USE) GamePieces = GAME_STR_TO_USE.split(',').map(x => parseInt(x));

	draw();
}

let gameHistory = [];
let searchCalls = 0n;
let gameOver = false;

// To be called each frame
function draw() {

	if (!gameOver) {
		// If the board is empty, choose a random starting move.
		// if (GamePieces.filter(x => x === PIECES.EMPTY).length === GamePieces.length) {
		// 	let randomStartChoice = Math.floor(Math.random()*GamePieces.length);
		// 	GamePieces[randomStartChoice] = TURN.AI_COLOR;
		// } else {
			let result = SearchAux(GamePieces, TURN.AI_COLOR);
			console.log(result);
			gameHistory.push(GamePieces.toString());
			GamePieces[result[0]] = TURN.AI_COLOR;
			RotateBoard(GamePieces, result[1], result[2]);
		// }

		CURRENT_TURN = TURN.PLAYER;

		if (Math.abs(Evaluate(GamePieces, TURN.AI_COLOR)) === Number.MAX_SAFE_INTEGER) {
			gameOver = true;
		}
	}
}

let originalDepth = 1;
let bestIndex = -1;
let iteriveDeepening = [];

function SearchAux(game, currentTurn) {
	let result;
	let depth = 1;
	let depthTime = 0;
	searchCalls = 0n;

	console.log('\nGame: ' + JSON.stringify(game));
	console.log('Current Turn: ' + (currentTurn === PIECES.WHITE ? 'WHITE' : 'BLACK'));
	console.log('Search Depth: (' + SEARCH_DEPTH + '), Strong Search Depth (' + STRONG_SEARCH_DEPTH + ')\n');

	while (depth <= SEARCH_DEPTH) {
		try {
			searchCalls = 0n;
			originalDepth = depth;
			
			depthTime = Date.now();
			result = Search(game, depth, currentTurn, currentTurn, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, []);
			depthTime = Date.now() - depthTime;

			if (depth === 1 && result[0] === Number.MIN_SAFE_INTEGER) {
				console.log('AI LOST!!!');
				break;
			}

			if (result[0] === Number.MAX_SAFE_INTEGER) {
				console.log("AI Winning Move:", PrettyResult(result[1][0].split(',')));
				break;
			} 

			iteriveDeepening = result[1].map(x => parseInt(x.split(',')[0]));
			console.log(`Depth (${depth}), Score (${result[0]}) (${PrettyResult(result[1][0].split(','))})`, `Calls (${searchCalls})`, `msTime (${depthTime})`);
			console.log(`Size (${SearchResultMap.size}), Hits (${cacheHits}), Misses (${cacheMisses})\n`);
			cacheHits = 0n;
			cacheMisses = 0n;
			SearchResultMap.clear();
			depth++;

			if (depth > GamePieces.filter(x => x === PIECES.EMPTY).length) break;
		} catch (err) {
			console.log(err);
			console.log({game, depthTime, depth, searchCalls, result});
			break;
		}
	}

	return result[1][0];
}

function PrettyResult(result) {
	let niceResults = result.map(x => x);
	niceResults[1] = niceResults[1] === '0' ? 'Q1' :
					 niceResults[1] === '1' ? 'Q2' :
					 niceResults[1] === '2' ? 'Q3' :
					'Q4';
	niceResults[2] = niceResults[2] === 'false' ? 'Left' : 'Right';
	return niceResults;
}

let SearchResultMap = new Map();
let cacheHits = 0n;
let cacheMisses = 0n;

function Search(game, depth, player, currentTurn, alpha, beta, moveHistory) {
	searchCalls += 1n;

	let gameStrKey = game.toString();
	let resultHasBeenCalculated = SearchResultMap.get(gameStrKey);

	if (resultHasBeenCalculated) {
		cacheHits++;
		return JSON.parse(JSON.stringify(resultHasBeenCalculated));
	} else {
		cacheMisses++;
	}


	let currentGameScore = Evaluate(game, player);

	if (depth <= 0) return [currentGameScore, moveHistory];
	if (currentGameScore === Number.MAX_SAFE_INTEGER || currentGameScore === Number.MIN_SAFE_INTEGER) return [currentGameScore, moveHistory];

	let listOfMoves = GetEmptyIndicies(game, currentTurn, depth);

	if (listOfMoves.length === 0) return [currentGameScore, moveHistory];

	let nextTurn = currentTurn === PIECES.BLACK ? PIECES.WHITE : PIECES.BLACK;

	let valueToReturn;

	if (player === currentTurn) {
		let bestScore = Number.MIN_SAFE_INTEGER;
		let bestMovesList;

		for (let i = 0; i < listOfMoves.length; ++i) {
			// Modify the Game Board with the move
			GamePieces[listOfMoves[i][0]] = currentTurn;
			RotateBoard(GamePieces, listOfMoves[i][1], listOfMoves[i][2]);

			let evaluationOfMove = Search(GamePieces, depth-1, player, nextTurn, alpha, beta, [...moveHistory, listOfMoves[i].toString()]);

			// Undo the move from Game Board
			RotateBoard(GamePieces, listOfMoves[i][1], !listOfMoves[i][2]);
			GamePieces[listOfMoves[i][0]] = -1;

			if (evaluationOfMove[0] > bestScore) {
				bestScore = evaluationOfMove[0];
				bestMovesList = evaluationOfMove[1];
			}

			if (bestScore >= beta) break;

			alpha = Math.max(alpha, bestScore);
		}

		valueToReturn = [bestScore, bestMovesList];
	} else {
		let bestScore = Number.MAX_SAFE_INTEGER;
		let bestMovesList;

		for (let i = 0; i < listOfMoves.length; ++i) {
			// Modify the Game Board with the move
			GamePieces[listOfMoves[i][0]] = currentTurn;
			RotateBoard(GamePieces, listOfMoves[i][1], listOfMoves[i][2]);

			let evaluationOfMove = Search(GamePieces, depth-1, player, nextTurn, alpha, beta, [...moveHistory, listOfMoves[i].toString()]);

			// Undo the move from Game Board
			RotateBoard(GamePieces, listOfMoves[i][1], !listOfMoves[i][2]);
			GamePieces[listOfMoves[i][0]] = -1;

			// Choosing the minimum here because we assume the opponent chooses best possible move (which gives the target player the lowest score)
			if (evaluationOfMove[0] < bestScore) {
				bestScore = evaluationOfMove[0];
				bestMovesList = evaluationOfMove[1];
			}

			if (bestScore <= alpha) break;

			beta = Math.min(beta, bestScore);
		}

		valueToReturn = [bestScore, bestMovesList];
	}

	SearchResultMap.set(gameStrKey, valueToReturn);
	return valueToReturn;
}

const QUADRANT0_SYMMETRY_IGNORE = {0: true, 1: true, 2: true, 6: true};
const QUADRANT1_SYMMETRY_IGNORE = {3: true, 4: true, 5: true, 9: true};
const QUADRANT2_SYMMETRY_IGNORE = {18: true, 19: true, 20: true, 24: true};
const QUADRANT3_SYMMETRY_IGNORE = {21: true, 22: true, 23: true, 27: true};

function GetEmptyIndicies(game, targetColor, depth) {
	let emptyIndexList = [];
	let quadrantsChoosen = 0;
	let indexScoreLookup = {};

	let Q1s = QuadrantSymmetricWithPiece(game, 7, 0);
	let Q2s = QuadrantSymmetricWithPiece(game, 10, 1);
	let Q3s = QuadrantSymmetricWithPiece(game, 25, 2);
	let Q4s = QuadrantSymmetricWithPiece(game, 28, 3);

	let leftScore = 0;
	let rightScore = 0;
	let bestScoreSoFar = 0;

	for (let i = 0; i < game.length; ++i) {
		if (game[i] !== PIECES.EMPTY) continue;
		if (Q1s && QUADRANT0_SYMMETRY_IGNORE[i]) continue;
		if (Q2s &&  QUADRANT1_SYMMETRY_IGNORE[i]) continue;
		if (Q3s &&  QUADRANT2_SYMMETRY_IGNORE[i]) continue;
		if (Q4s &&  QUADRANT3_SYMMETRY_IGNORE[i]) continue;

		quadrantsChoosen = 0;

		if (!Q1s || !QuadrantSymmetricWithPiece(game, i, 0)) {
			leftScore = CountColorsOnRowColDiagV2(game, [i, 0, false], targetColor);
			rightScore = CountColorsOnRowColDiagV2(game, [i, 0, true], targetColor);

			if (leftScore > bestScoreSoFar) {
				emptyIndexList.unshift([i, 0, false]);
				emptyIndexList.push([i, 0, true]);
				bestScoreSoFar = leftScore;
			}
			else if (rightScore > bestScoreSoFar) {
				emptyIndexList.push([i, 0, false]);
				emptyIndexList.unshift([i, 0, true]);
				bestScoreSoFar = rightScore;
			}
			else {
				emptyIndexList.push([i, 0, false]);
				emptyIndexList.push([i, 0, true]);
			}
			++quadrantsChoosen;
		}

		if (!Q2s || !QuadrantSymmetricWithPiece(game, i, 1)) {
			leftScore = CountColorsOnRowColDiagV2(game, [i, 1, false], targetColor);
			rightScore = CountColorsOnRowColDiagV2(game, [i, 1, true], targetColor);

			if (leftScore > bestScoreSoFar) {
				emptyIndexList.unshift([i, 1, false]);
				emptyIndexList.push([i, 1, true]);
				bestScoreSoFar = leftScore;
			}
			else if (rightScore > bestScoreSoFar) {
				emptyIndexList.push([i, 1, false]);
				emptyIndexList.unshift([i, 1, true]);
				bestScoreSoFar = rightScore;
			}
			else {
				emptyIndexList.push([i, 1, false]);
				emptyIndexList.push([i, 1, true]);
			}
			++quadrantsChoosen;
		}

		if (!Q3s || !QuadrantSymmetricWithPiece(game, i, 2)) {
			leftScore = CountColorsOnRowColDiagV2(game, [i, 2, false], targetColor);
			rightScore = CountColorsOnRowColDiagV2(game, [i, 2, true], targetColor);

			if (leftScore > bestScoreSoFar) {
				emptyIndexList.unshift([i, 2, false]);
				emptyIndexList.push([i, 2, true]);
				bestScoreSoFar = leftScore;
			}
			else if (rightScore > bestScoreSoFar) {
				emptyIndexList.push([i, 2, false]);
				emptyIndexList.unshift([i, 2, true]);
				bestScoreSoFar = rightScore;
			}
			else {
				emptyIndexList.push([i, 2, false]);
				emptyIndexList.push([i, 2, true]);
			}
			++quadrantsChoosen;
		}

		if (!Q4s || !QuadrantSymmetricWithPiece(game, i, 3)) {
			leftScore = CountColorsOnRowColDiagV2(game, [i, 3, false], targetColor);
			rightScore = CountColorsOnRowColDiagV2(game, [i, 3, true], targetColor);

			if (leftScore > bestScoreSoFar) {
				emptyIndexList.unshift([i, 3, false]);
				emptyIndexList.push([i, 3, true]);
				bestScoreSoFar = leftScore;
			}
			else if (rightScore > bestScoreSoFar) {
				emptyIndexList.push([i, 3, false]);
				emptyIndexList.unshift([i, 3, true]);
				bestScoreSoFar = rightScore;
			}
			else {
				emptyIndexList.push([i, 3, false]);
				emptyIndexList.push([i, 3, true]);
			}
			++quadrantsChoosen;
		}

			if (quadrantsChoosen === 0) {
				emptyIndexList.push([i, 0, false]);
			}
	}

	if (iteriveDeepening.length > 0) {
		let iteriveDeepeningValue = iteriveDeepening.shift();

		emptyIndexList.sort((a,b) => {
		 	if (a[0] !== iteriveDeepeningValue && b[0] !== iteriveDeepeningValue) {
		 		let scoreA = CountColorsOnRowColDiagV2(game, a, targetColor);
		 		let scoreB = CountColorsOnRowColDiagV2(game, b, targetColor);
		 		return scoreA > scoreB ? -1 : 1;
		 	}
			return a[0] === iteriveDeepeningValue ? -1 : b[0] === iteriveDeepeningValue ? 1 : 0;
		});
	} else {
		if (Math.abs(originalDepth - depth) < STRONG_SEARCH_DEPTH) {
			emptyIndexList.sort((a,b) => {
				let scoreA = CountColorsOnRowColDiagV2(game, a, targetColor);
				let scoreB = CountColorsOnRowColDiagV2(game, b, targetColor);
				return scoreA > scoreB ? -1 : 1;
			});
		}
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
	let plusAmount = QUADRANT_PLUS_AMOUNTS[quadrant];

	let oldLeftValues = [game[QUADRANT_INDICES[0]+plusAmount], game[QUADRANT_INDICES[1]+plusAmount]];
	let oldRightValues = [game[QUADRANT_INDICES[6]+plusAmount], game[QUADRANT_INDICES[7]+plusAmount]];

	if (!direction) {
		for (let i = 0; i < QUADRANT_INDICES.length; ++i) {
			if (i > 5) game[QUADRANT_INDICES[i]+plusAmount] = oldLeftValues[i-6];
			else game[QUADRANT_INDICES[i]+plusAmount] = game[QUADRANT_INDICES[i]+plusAmount+LEFT_TURN_ADD_AMOUNT[i]];
		}
	} else {
		for (let i = QUADRANT_INDICES.length-1; i > -1; --i) {
			if (i < 2) game[QUADRANT_INDICES[i]+plusAmount] = oldRightValues[i];
			else game[QUADRANT_INDICES[i]+plusAmount] = game[QUADRANT_INDICES[i]+plusAmount+RIGHT_TURN_ADD_AMOUNT[i]];
		}
	}
}

function Evaluate(game, targetColor) {
	let whiteStrength = EvaluateStrength(game, PIECES.WHITE);
	let blackStrength = EvaluateStrength(game, PIECES.BLACK);

	if (whiteStrength === blackStrength) return 0;
	else if (targetColor === PIECES.WHITE && whiteStrength === Number.MAX_SAFE_INTEGER) return Number.MAX_SAFE_INTEGER;
	else if (targetColor === PIECES.WHITE && blackStrength === Number.MAX_SAFE_INTEGER) return Number.MIN_SAFE_INTEGER;
	else if (targetColor === PIECES.BLACK && blackStrength === Number.MAX_SAFE_INTEGER) return Number.MAX_SAFE_INTEGER;
	else if (targetColor === PIECES.BLACK && whiteStrength === Number.MAX_SAFE_INTEGER) return Number.MIN_SAFE_INTEGER;
	else if (targetColor === PIECES.WHITE) return whiteStrength - blackStrength;
	return blackStrength - whiteStrength;
}

function EvaluateStrength(game, targetColor) {
	let score = 0;
	let tempScore;

	for (let i = 0; i < ROW_INDICES.length; ++i) {
		tempScore = CountRowColDiagScore(game, ROW_INDICES[i], targetColor);

		if (tempScore === Number.MAX_SAFE_INTEGER) return tempScore;
		score += tempScore;
	}

	for (let i = 0; i < COL_INDICES.length; ++i) {
		tempScore = CountRowColDiagScore(game, COL_INDICES[i], targetColor);

		if (tempScore === Number.MAX_SAFE_INTEGER) return tempScore;
		score += tempScore;
	}

	for (let i = 0; i < DIAGONAL_INDICES.length; ++i) {
		tempScore = CountRowColDiagScore(game, DIAGONAL_INDICES[i], targetColor);

		if (tempScore === Number.MAX_SAFE_INTEGER) return tempScore;
		score += tempScore;
	}

	return score;
}

function CountColorsOnRowColDiag(game, index, targetColor) {
	let rowIndices = ROW_INDICES[Math.floor(index/6)];
	let colIndices = COL_INDICES[index%6];
	let diagIndices = DIAGONAL_INDICES_FROM_INDEX[index];
	let nearbyIndices = SURROUNDING_INDICES[index];
	let count = 0;

	for (let i = 0; i < rowIndices.length; ++i) {
		if (game[rowIndices[i]] === targetColor) count += 1;
	}

	for (let i = 0; i < colIndices.length; ++i) {
		if (game[colIndices[i]] === targetColor) count += 1;
	}

	for (let i = 0; i < diagIndices.length; ++i) {
		for (let j = 0; j < DIAGONAL_INDICES[diagIndices[i]].length; ++j) {
			if (game[DIAGONAL_INDICES[diagIndices[i]][j]] === targetColor) count += 1;
		}
	}

	for (let i = 0; i < nearbyIndices.length; ++i) {
		if (game[nearbyIndices[i]] === targetColor) count += 2;
	}

	// return count*(Math.random() - 0.5);
	// return count + ((2*Math.random() - 1.0)*(count/20));
	
	// count = (count*(count-1))/2;
	// return count + ((2*Math.random() - 1.0)*(count/20));
	
	// return (count*(count-1))/2;
	
	return count;
}

function CountColorsOnRowColDiagV2(game, move, targetColor) {
	// let result = EvaluateStrength(game, targetColor);
	GamePieces[move[0]] = targetColor;
	RotateBoard(game, move[1], move[2]);

	// result = EvaluateStrength(game, targetColor) - result;
	let result = EvaluateStrength(game, targetColor);

	RotateBoard(game, move[1], !move[2]);
	GamePieces[move[0]] = -1;

	return result;
	// return result + ((2*Math.random() - 1.0)*(result/10));
}

function CountRowColDiagScore(game, rowColDiagIndexList, targetColor) {
	let score = 0;
	let openStart = false;
	let openEnd = false;
	let consecutive = 0;

	for (let i = 0; i < rowColDiagIndexList.length; ++i) {
		if (game[rowColDiagIndexList[i]] === targetColor) {
			consecutive++;
		} else {
			if (game[rowColDiagIndexList[i]] === PIECES.EMPTY) openEnd = true;
			else openEnd = false;

			if (consecutive >= 2) {
				score = ScoreConsecutive(score, consecutive, openStart, openEnd);
			}

			consecutive = 0;
			openEnd = false;

			if (game[rowColDiagIndexList[i]] === PIECES.EMPTY) openStart = true;
			else openStart = false;
		}
	}

	if (consecutive >= 2) {
		score = ScoreConsecutive(score, consecutive, openStart, openEnd);
	}

	return score;
}

function ScoreConsecutive(currentScore, consecutive, openStart, openEnd) {
	if (consecutive === 2) return currentScore + ((openStart || openEnd) ? ((openStart && openEnd) ? doubleOpenEndPair : openEndPair) : pairScore);
	else if (consecutive === 3) return currentScore + ((openStart || openEnd) ? ((openStart && openEnd) ? doubleOpenEndTriplet : openEndTriplet) : tripletScore);
	else if (consecutive === 4) return currentScore + ((openStart || openEnd) ? ((openStart && openEnd) ? doubleOpenEndQuad : openEndQuad) : quadScore);
	return Number.MAX_SAFE_INTEGER;
}

setup();