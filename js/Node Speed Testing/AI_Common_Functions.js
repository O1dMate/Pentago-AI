let PIECES = { 'EMPTY': -1, 'BLACK': 0, 'WHITE': 1 };

const OTHER_PLAYER_LOOKUP = { [PIECES.WHITE]: PIECES.BLACK, [PIECES.BLACK]: PIECES.WHITE };
const ROW_INDICES = [[0, 1, 2, 3, 4, 5], [6, 7, 8, 9, 10, 11], [12, 13, 14, 15, 16, 17], [18, 19, 20, 21, 22, 23], [24, 25, 26, 27, 28, 29], [30, 31, 32, 33, 34, 35]];
const COL_INDICES = [[0, 6, 12, 18, 24, 30], [1, 7, 13, 19, 25, 31], [2, 8, 14, 20, 26, 32], [3, 9, 15, 21, 27, 33], [4, 10, 16, 22, 28, 34], [5, 11, 17, 23, 29, 35]];
const DIAGONAL_INDICES = [[6, 13, 20, 27, 34], [0, 7, 14, 21, 28, 35], [1, 8, 15, 22, 29], [24, 19, 14, 9, 4], [30, 25, 20, 15, 10, 5], [31, 26, 21, 16, 11]];
const DIAGONAL_INDICES_FROM_INDEX = [];
const SURROUNDING_INDICES = [];

let pairScore = 2; // Score for having two in a row
let tripletScore = 100; // Score for having three in a row
let quadScore = 20; // Score for having four in a row

let openEndPair = 8; // Score for two in a row, but with an open end.
let openEndTriplet = 20; // Score for three in a row, but with an open end.
let openEndQuad = 80; // Score for four in a row, but with an open end.

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
		'E': (i % 6 === 5),
		'W': (i % 6 === 0),
	};

	// General Case
	if (!isOnEdge.N && !isOnEdge.S && !isOnEdge.E && !isOnEdge.W) {
		currentArray.push(i - 7); currentArray.push(i - 6); currentArray.push(i - 5);
		currentArray.push(i - 1); currentArray.push(i + 1);
		currentArray.push(i + 5); currentArray.push(i + 6); currentArray.push(i + 7);
	}
	// 4 Corners
	else if (isOnEdge.N && isOnEdge.W) {
		currentArray.push(i + 1);
		currentArray.push(i + 6); currentArray.push(i + 7);
	} else if (isOnEdge.N && isOnEdge.E) {
		currentArray.push(i - 1);
		currentArray.push(i + 5); currentArray.push(i + 6);
	} else if (isOnEdge.S && isOnEdge.W) {
		currentArray.push(i - 6); currentArray.push(i - 5);
		currentArray.push(i + 1);
	} else if (isOnEdge.S && isOnEdge.E) {
		currentArray.push(i - 7); currentArray.push(i - 6);
		currentArray.push(i - 1);
	}
	// Edges, but not corners
	else if (isOnEdge.N) {
		currentArray.push(i - 1); currentArray.push(i + 1);
		currentArray.push(i + 5); currentArray.push(i + 6); currentArray.push(i + 7);
	} else if (isOnEdge.S) {
		currentArray.push(i - 7); currentArray.push(i - 6); currentArray.push(i - 5);
		currentArray.push(i - 1); currentArray.push(i + 1);
	} else if (isOnEdge.E) {
		currentArray.push(i - 7); currentArray.push(i - 6);
		currentArray.push(i - 1);
		currentArray.push(i + 5); currentArray.push(i + 6);
	} else if (isOnEdge.W) {
		currentArray.push(i - 6); currentArray.push(i - 5);
		currentArray.push(i + 1);
		currentArray.push(i + 6); currentArray.push(i + 7);
	}

	SURROUNDING_INDICES.push(currentArray);
}

function PrettyResult(result) {
	let niceResults = result.map(x => x);
	niceResults[1] = niceResults[1] === 0 ? 'Q1' :
		niceResults[1] === 1 ? 'Q2' :
			niceResults[1] === 2 ? 'Q3' :
				'Q4';
	niceResults[2] = niceResults[2] === false ? 'Left' : 'Right';
	return niceResults;
}

let QUADRANT_CENTER = { 7: true, 10: true, 25: true, 28: true };
let QUADRANT_SYMMETRIC_INDICES_MAP = { 0: true, 1: true, 2: true, 6: true, 8: true, 12: true, 13: true, 14: true };
let QUADRANT_SYMMETRIC_INDICES_ARRAY = [0, 1, 2, 6, 8, 12, 13, 14];
let QUADRANT_SYMMETRIC_PLUS_AMOUNTS = [0, 3, 18, 21];

function QuadrantSymmetricWithPiece(game, index, quadrant) {
	let plusAmount = QUADRANT_SYMMETRIC_PLUS_AMOUNTS[quadrant];
	let tempIndex = 0;

	if (QUADRANT_SYMMETRIC_INDICES_MAP[index+plusAmount]) return false;

	for (let i = 0; i < QUADRANT_SYMMETRIC_INDICES_ARRAY.length; ++i) {
		tempIndex = QUADRANT_SYMMETRIC_INDICES_ARRAY[i] + plusAmount;

		if (game[tempIndex] !== PIECES.EMPTY && !QUADRANT_CENTER[tempIndex]) return false;
		if (tempIndex === index && !QUADRANT_CENTER[tempIndex]) return false;
	}
	
	return true;
}

let QUADRANT_INDICES = [0, 1, 2, 8, 14, 13, 12, 6];
let LEFT_TURN_ADD_AMOUNT = [2, 7, 12, 5, -2, -7, -12, -5]; // Based on the QUADRANT_INDICES Array
let RIGHT_TURN_ADD_AMOUNT = [12, 5, -2, -7, -12, -5, 2, 7]; // Based on the QUADRANT_INDICES Array
let QUADRANT_PLUS_AMOUNTS = [0, 3, 18, 21];

// game = game board
// quadrant = 0,1,2,3 (TL, TR, BL, BR)
// direction = false,true (left, right)
function RotateBoard(game, quadrant, direction) {
	let plusAmount = QUADRANT_PLUS_AMOUNTS[quadrant];

	let oldLeftValues = [game[QUADRANT_INDICES[0] + plusAmount], game[QUADRANT_INDICES[1] + plusAmount]];
	let oldRightValues = [game[QUADRANT_INDICES[6] + plusAmount], game[QUADRANT_INDICES[7] + plusAmount]];

	if (!direction) {
		for (let i = 0; i < QUADRANT_INDICES.length; ++i) {
			if (i > 5) game[QUADRANT_INDICES[i] + plusAmount] = oldLeftValues[i - 6];
			else game[QUADRANT_INDICES[i] + plusAmount] = game[QUADRANT_INDICES[i] + plusAmount + LEFT_TURN_ADD_AMOUNT[i]];
		}
	} else {
		for (let i = QUADRANT_INDICES.length - 1; i > -1; --i) {
			if (i < 2) game[QUADRANT_INDICES[i] + plusAmount] = oldRightValues[i];
			else game[QUADRANT_INDICES[i] + plusAmount] = game[QUADRANT_INDICES[i] + plusAmount + RIGHT_TURN_ADD_AMOUNT[i]];
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
	let rowIndices = ROW_INDICES[Math.floor(index / 6)];
	let colIndices = COL_INDICES[index % 6];
	let diagIndices = DIAGONAL_INDICES_FROM_INDEX[index];
	let nearbyIndices = SURROUNDING_INDICES[index];
	let count = 0;

	for (let i = 0; i < rowIndices.length; ++i) {
		if (game[rowIndices[i]] === targetColor) ++count;
	}

	for (let i = 0; i < colIndices.length; ++i) {
		if (game[colIndices[i]] === targetColor) ++count;
	}

	for (let i = 0; i < diagIndices.length; ++i) {
		for (let j = 0; j < DIAGONAL_INDICES[diagIndices[i]].length; ++j) {
			if (game[DIAGONAL_INDICES[diagIndices[i]][j]] === targetColor) ++count;
		}
	}

	for (let i = 0; i < nearbyIndices.length; ++i) {
		if (game[nearbyIndices[i]] === targetColor) ++count;
	}

	return count;
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
	if (consecutive === 2) return currentScore + ((openStart || openEnd) ? ((openStart && openEnd) ? 2 * openEndPair : openEndPair) : pairScore);
	else if (consecutive === 3) return currentScore + ((openStart || openEnd) ? ((openStart && openEnd) ? 2 * openEndTriplet : openEndTriplet) : tripletScore);
	else if (consecutive === 4) return currentScore + ((openStart || openEnd) ? ((openStart && openEnd) ? 100_000 : openEndQuad) : quadScore);
	return Number.MAX_SAFE_INTEGER;
}

function CountColorsOnRowColDiagV2(game, move, targetColor) {
	game[move[0]] = targetColor;
	RotateBoard(game, move[1], move[2]);

	let result = Evaluate(game, targetColor);

	RotateBoard(game, move[1], !move[2]);
	game[move[0]] = -1;

	return result;
}

// function ScoreAfterRotation(game, move, targetColor) {
// 	RotateBoard(game, move[0], move[1]);
// 	let result = Evaluate(game, targetColor);
// 	RotateBoard(game, move[0], !move[1]);

// 	return result;
// }

// function IsForcedMoveForPlayer(game, move, opponentColor) {
// 	// console.log(move, EvaluateStrength(game, opponentColor), game.toString());
// 	game[move[0]] = OTHER_PLAYER_LOOKUP[opponentColor];
// 	RotateBoard(game, move[1], move[2]);
// 	// console.log(move, EvaluateStrength(game, opponentColor), game.toString());

// 	let score = 0;
	
// 	// If the game is lost after the move, don't check if it forces the opponent to block.
// 	if (EvaluateStrength(game, opponentColor) === Number.MAX_SAFE_INTEGER) score = Number.MIN_SAFE_INTEGER;
// 	else {
// 		let oppCanWin = false;
// 		let tempScore = 0;

// 		// Can opponent Win next move
// 		for (let dir = 0; dir < 2; ++dir) {
// 			if (oppCanWin) break;

// 			for (let quad = 0; quad < 4; ++quad) {
				
// 				// console.log(move, quad, dir, EvaluateStrength(game, opponentColor));
				
// 				RotateBoard(game, quad, !!dir);
// 				tempScore = EvaluateStrength(game, opponentColor);
// 				RotateBoard(game, quad, !!!dir);

// 				if (tempScore === Number.MAX_SAFE_INTEGER) {
// 					oppCanWin = true;
// 					break;
// 				}
// 			}
// 		}

// 		// console.log(move, { oppCanWin });

// 		if (oppCanWin) score = Number.MIN_SAFE_INTEGER;
// 		else if (ForcedMoveToPreventWin(game, OTHER_PLAYER_LOOKUP[opponentColor])) score = -1000;
// 		else if (ForcedMoveToPreventWin(game, opponentColor)) score = 1000;
// 		else if (ForcedMoveToStopFourInARowWithOpenEnds(game, OTHER_PLAYER_LOOKUP[opponentColor])) score = -100;
// 		else if (ForcedMoveToStopFourInARowWithOpenEnds(game, opponentColor)) score = 100;
// 	}

// 	RotateBoard(game, move[1], !move[2]);
// 	game[move[0]] = -1;

// 	return score;
// }

// function IsForcedMoveForPlayer(game, move, targetColor) {
// 	game[move[0]] = OTHER_PLAYER_LOOKUP[targetColor];
// 	RotateBoard(game, move[1], move[2]);

// 	let result;

// 	// If the game is lost after the move, don't check if it forces the opponent to block.
// 	console.log(move, Evaluate(game, targetColor));

// 	if (Evaluate(game, targetColor) === Number.MAX_SAFE_INTEGER) result = false;
// 	else {
// 		if (ForcedMoveToPreventWin(game, OTHER_PLAYER_LOOKUP[targetColor])) result = false;
// 		else result = _IsForcedMoveForPlayer(game, targetColor);
// 	}

// 	RotateBoard(game, move[1], !move[2]);
// 	game[move[0]] = -1;

// 	return result;
// }

function IsForcedMoveForPlayer(game, targetColor) {
	// Check for 3 in a single row (NOT only in a row), with open ends, and no opponent pieces
	// The other player must block prevent 4 in a row with an open end or they will lose.
	if (ForcedMoveToStopFourInARowWithOpenEnds(game, targetColor)) return true;

	// Check for 4 in a single row (NOT only in a row), with an empty spot in the middle that will make 5 in a row.
	// This check all detects 4 in a row with either an open end or both open ends.
	// The other player must block this empty spot or they will lose.
	if (ForcedMoveToPreventWin(game, targetColor)) return true;

	return false;
}

function ForcedMoveToStopFourInARowWithOpenEnds(game, targetColor) {
	for (let i = 0; i < ROW_INDICES.length; ++i) {
		if (_ForcedMoveCheckThreeInARowOpenEndNoOpponent(game, ROW_INDICES[i], targetColor)) return true;
	}

	for (let i = 0; i < COL_INDICES.length; ++i) {
		if (_ForcedMoveCheckThreeInARowOpenEndNoOpponent(game, COL_INDICES[i], targetColor)) return true;
	}

	for (let i = 0; i < DIAGONAL_INDICES.length; ++i) {
		if (_ForcedMoveCheckThreeInARowOpenEndNoOpponent(game, DIAGONAL_INDICES[i], targetColor)) return true;
	}

	return false;
}

function ForcedMoveToPreventWin(game, targetColor) {
	for (let i = 0; i < ROW_INDICES.length; ++i) {
		if (_ForcedMoveCheckFourInARowAboutToBeFive(game, ROW_INDICES[i], targetColor)) return true;
	}

	for (let i = 0; i < COL_INDICES.length; ++i) {
		if (_ForcedMoveCheckFourInARowAboutToBeFive(game, COL_INDICES[i], targetColor)) return true;
	}

	for (let i = 0; i < DIAGONAL_INDICES.length; ++i) {
		if (_ForcedMoveCheckFourInARowAboutToBeFive(game, DIAGONAL_INDICES[i], targetColor)) return true;
	}

	return false;
}

// Check for 3 in a single row (NOT only in a row), with open ends, and no opponent pieces
// The other player must block prevent 4 in a row with an open end or they will lose.
function _ForcedMoveCheckThreeInARowOpenEndNoOpponent(game, rowColDiagIndexList, targetColor) {
	// If the row is only length 5, this isn't a concern. Even if the three in a row have open ends, adding an extra one will remove the open end. Only rows of size 6 can lead to 4 in a row with open ends.
	if (rowColDiagIndexList.length === 5) return false;

	// If the two ends aren't empty, then this won't lead to 4 in a row with open ends.
	if (game[rowColDiagIndexList[0]] !== PIECES.EMPTY) return false;
	if (game[rowColDiagIndexList[5]] !== PIECES.EMPTY) return false;

	let numberOfEmpties = 0;

	for (let i = 1; i < rowColDiagIndexList.length-1; ++i) {
		if (game[rowColDiagIndexList[i]] === targetColor) return false;

		if (game[rowColDiagIndexList[i]] === PIECES.EMPTY) numberOfEmpties++;

		if (numberOfEmpties > 1) return false;
	}

	return true;
}

function _ForcedMoveCheckFourInARowAboutToBeFive(game, rowColDiagIndexList, targetColor) {
	let emptyCount = 0;
	let targetColorCount = 0;

	if (rowColDiagIndexList.length === 6) {
		for (let i = 0; i < rowColDiagIndexList.length-1; ++i) {
			if (game[rowColDiagIndexList[i]] === targetColor) break;
			else if (game[rowColDiagIndexList[i]] === PIECES.EMPTY) emptyCount++;
			else targetColorCount++;
		}

		if (emptyCount === 1 && targetColorCount === 4) return true;

		emptyCount = 0;
		targetColorCount = 0;

		for (let i = 1; i < rowColDiagIndexList.length; ++i) {
			if (game[rowColDiagIndexList[i]] === targetColor) break;
			else if (game[rowColDiagIndexList[i]] === PIECES.EMPTY) emptyCount++;
			else targetColorCount++;
		}

		if (emptyCount === 1 && targetColorCount === 4) return true;
	} else {
		for (let i = 0; i < rowColDiagIndexList.length; ++i) {
			if (game[rowColDiagIndexList[i]] === targetColor) return false;
			else if (game[rowColDiagIndexList[i]] === PIECES.EMPTY) emptyCount++;
			else targetColorCount++;
		}

		if (emptyCount === 1 && targetColorCount === 4) return true;
	}


	return false;
}

module.exports = {
	PrettyResult, QuadrantSymmetricWithPiece, RotateBoard, Evaluate, EvaluateStrength, CountColorsOnRowColDiag, CountColorsOnRowColDiagV2, CountRowColDiagScore, ScoreConsecutive, IsForcedMoveForPlayer, ForcedMoveToStopFourInARowWithOpenEnds, ForcedMoveToPreventWin };