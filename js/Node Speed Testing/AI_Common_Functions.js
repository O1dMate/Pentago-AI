let PIECES = { 'EMPTY': -1, 'BLACK': 0, 'WHITE': 1 };

const OTHER_PLAYER_LOOKUP = { [PIECES.WHITE]: PIECES.BLACK, [PIECES.BLACK]: PIECES.WHITE };
const ROW_INDICES = [[0, 1, 2, 3, 4, 5], [6, 7, 8, 9, 10, 11], [12, 13, 14, 15, 16, 17], [18, 19, 20, 21, 22, 23], [24, 25, 26, 27, 28, 29], [30, 31, 32, 33, 34, 35]];
const COL_INDICES = [[0, 6, 12, 18, 24, 30], [1, 7, 13, 19, 25, 31], [2, 8, 14, 20, 26, 32], [3, 9, 15, 21, 27, 33], [4, 10, 16, 22, 28, 34], [5, 11, 17, 23, 29, 35]];
const DIAGONAL_INDICES = [[6, 13, 20, 27, 34], [0, 7, 14, 21, 28, 35], [1, 8, 15, 22, 29], [24, 19, 14, 9, 4], [30, 25, 20, 15, 10, 5], [31, 26, 21, 16, 11]];
const DIAGONAL_INDICES_FROM_INDEX = [];
const SURROUNDING_INDICES = [];

let pairScore = 2; // Score for having two in a row
let tripletScore = 10; // Score for having three in a row
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

function convertRowToInt(a, b, c, d, e, f) {
	return (a === PIECES.EMPTY ? 0 : (a === PIECES.BLACK ? 1 : 2) << 10) |
		(b === PIECES.EMPTY ? 0 : (b === PIECES.BLACK ? 1 : 2) << 8) |
		(c === PIECES.EMPTY ? 0 : (c === PIECES.BLACK ? 1 : 2) << 6) |
		(d === PIECES.EMPTY ? 0 : (d === PIECES.BLACK ? 1 : 2) << 4) |
		(e === PIECES.EMPTY ? 0 : (e === PIECES.BLACK ? 1 : 2) << 2) |
		(f === PIECES.EMPTY ? 0 : (f === PIECES.BLACK ? 1 : 2));
}

const ROW_SCORE_LOOKUP = {
	[PIECES.WHITE]: {
		6: {},
		5: {},
	},
	[PIECES.BLACK]: {
		6: {},
		5: {},
	},
};

function GetScoreOfRow(row, targetColor) {
	let score = 0;
	let openStart = false;
	let openEnd = false;
	let consecutive = 0;

	for (let i = 0; i < row.length; ++i) {
		if (row[i] === targetColor) {
			consecutive++;
		} else {
			if (row[i] === PIECES.EMPTY) openEnd = true;
			else openEnd = false;

			if (consecutive >= 2) {
				score = ScoreConsecutive(score, consecutive, openStart, openEnd);
			}

			consecutive = 0;
			openEnd = false;

			if (row[i] === PIECES.EMPTY) openStart = true;
			else openStart = false;
		}
	}

	if (consecutive >= 2) {
		score = ScoreConsecutive(score, consecutive, openStart, openEnd);
	}

	return score;
}

function GetScoreOfRowV2(row, targetColor) {
	// Check for 3 in a single row (NOT only in a row), with open ends, and no opponent pieces
	// The other player must block prevent 4 in a row with an open end or they will lose.
	// let playerIsForcedToPreventFour = ForcedMoveToStopFourInARowWithOpenEnds(row, targetColor);
	
	if (CheckForWin(row, targetColor)) return Number.MAX_SAFE_INTEGER;
	else if (CheckForWin(row, OTHER_PLAYER_LOOKUP[targetColor])) return Number.MIN_SAFE_INTEGER;

	let isPlayerAboutToLose = CheckForFourInARowWithOpenEnds(row, OTHER_PLAYER_LOOKUP[targetColor]);
	let isPlayerForcedToBlockWin = _ForcedMoveCheckFourInARowAboutToBeFiveV2(row, targetColor);
	let isPlayerForcedToStopFourInARow = _ForcedMoveCheckThreeInARowOpenEndNoOpponentV2(row, targetColor);
	
	let isPlayerAboutToWin = CheckForFourInARowWithOpenEnds(row, targetColor);
	let isPlayerCurrentlyAboutToForcePreventWin = _ForcedMoveCheckFourInARowAboutToBeFiveV2(row, OTHER_PLAYER_LOOKUP[targetColor]);
	let isPlayerCurrentlyAboutToForceFourInARow = _ForcedMoveCheckThreeInARowOpenEndNoOpponentV2(row, OTHER_PLAYER_LOOKUP[targetColor]);

	// console.log({ isPlayerAboutToLose, isPlayerForcedToBlockWin, isPlayerForcedToStopFourInARow });
	// console.log({ isPlayerAboutToWin, isPlayerCurrentlyAboutToForcePreventWin, isPlayerCurrentlyAboutToForceFourInARow });

	if (isPlayerAboutToLose) return -100_000;
	if (isPlayerForcedToBlockWin) return -1_000;
	if (isPlayerForcedToStopFourInARow) return -100;
	
	if (isPlayerAboutToWin) return 100_000;
	if (isPlayerCurrentlyAboutToForcePreventWin) return 1_000;
	if (isPlayerCurrentlyAboutToForceFourInARow) return 100;

	let playerCount = row.filter(cell => cell === targetColor).length;
	let opponentCount = row.filter(cell => cell === OTHER_PLAYER_LOOKUP[targetColor]).length;

	return playerCount-opponentCount;

	// Check for 4 in a single row (NOT only in a row), with an empty spot in the middle that will make 5 in a row.
	// This check all detects 4 in a row with either an open end or both open ends.
	// The other player must block this empty spot or they will lose.
	// if (ForcedMoveToPreventWin(game, targetColor)) return true;
}

function CheckForFourInARowWithOpenEnds(row, targetColor) {
	if (row.length === 5) return false;

	// If the two ends aren't empty, then this won't lead to 4 in a row with open ends.
	if (row[0] !== PIECES.EMPTY) return false;
	if (row[5] !== PIECES.EMPTY) return false;

	for (let i = 1; i < row.length-1; ++i) {
		if (row[i] !== targetColor) return false;
	}

	return true;
}

// Check for 3 in a single row (NOT only in a row), with open ends, and no opponent pieces
// The other player must block prevent 4 in a row with an open end or they will lose.
function _ForcedMoveCheckThreeInARowOpenEndNoOpponentV2(row, targetColor) {
	// If the row is only length 5, this isn't a concern. Even if the three in a row have open ends, adding an extra one will remove the open end. Only rows of size 6 can lead to 4 in a row with open ends.
	// if (row.length === 5) return false;

	if (row.length === 6) {
		if (row[0] === PIECES.EMPTY && row[5] === PIECES.EMPTY) {
			let numberOfEmpties = 0;

			for (let i = 1; i < row.length - 1; ++i) {
				if (row[i] === targetColor) return false;

				if (row[i] === PIECES.EMPTY) numberOfEmpties++;

				if (numberOfEmpties > 1) return false;
			}

			return true;
		} else if (row[0] === PIECES.EMPTY && row[4] === PIECES.EMPTY) {
			for (let i = 1; i < row.length - 2; ++i) {
				if (row[i] === targetColor || row[i] === PIECES.EMPTY) return false;
			}

			return true;
		} else if (row[1] === PIECES.EMPTY && row[5] === PIECES.EMPTY) {
			for (let i = 2; i < row.length - 1; ++i) {
				if (row[i] === targetColor || row[i] === PIECES.EMPTY) return false;
			}

			return true;
		}
	}


	// If the two ends aren't empty, then this won't lead to 4 in a row with open ends.
	if (row[0] !== PIECES.EMPTY) return false;
	if (row[5] !== PIECES.EMPTY) return false;

	let numberOfEmpties = 0;

	for (let i = 1; i < row.length-1; ++i) {
		if (row[i] === targetColor) return false;

		if (row[i] === PIECES.EMPTY) numberOfEmpties++;

		if (numberOfEmpties > 1) return false;
	}

	return true;
}

function _ForcedMoveCheckFourInARowAboutToBeFiveV2(row, targetColor) {
	let emptyCount = 0;
	let targetColorCount = 0;

	if (row.length === 6) {
		for (let i = 0; i < row.length-1; ++i) {
			if (row[i] === targetColor) break;
			else if (row[i] === PIECES.EMPTY) emptyCount++;
			else targetColorCount++;
		}

		if (emptyCount === 1 && targetColorCount === 4) return true;

		emptyCount = 0;
		targetColorCount = 0;

		for (let i = 1; i < row.length; ++i) {
			if (row[i] === targetColor) break;
			else if (row[i] === PIECES.EMPTY) emptyCount++;
			else targetColorCount++;
		}

		if (emptyCount === 1 && targetColorCount === 4) return true;
	} else {
		for (let i = 0; i < row.length; ++i) {
			if (row[i] === targetColor) return false;
			else if (row[i] === PIECES.EMPTY) emptyCount++;
			else targetColorCount++;
		}

		if (emptyCount === 1 && targetColorCount === 4) return true;
	}

	return false;
}

function GetScoreOfRowV3(row, targetColor) {
	let E = PIECES.EMPTY.toString();
	let C = targetColor.toString();
	let O = OTHER_PLAYER_LOOKUP[targetColor].toString();

	let playerFiveInARow = C+C+C+C+C;
	let opponentFiveInARow = O+O+O+O+O;

	let playerFourInARow = [
		E + C + C + C + C,
		C + E + C + C + C,
		C + C + E + C + C,
		C + C + C + E + C,
		C + C + C + C + E,
	];

	let opponentFourInARow = [
		E + O + O + O + O,
		O + E + O + O + O,
		O + O + E + O + O,
		O + O + O + E + O,
		O + O + O + O + E,
	];

	let playerThreeInARow = [
		E + E + C + C + C,
		E + C + E + C + C,
		E + C + C + E + C,
		E + C + C + C + E,

		C + E + E + C + C,
		C + E + C + E + C,
		C + E + C + C + E,

		C + C + E + E + C,
		C + C + E + C + E,

		C + C + C + E + E,
	];

	let opponentThreeInARow = [
		E + E + O + O + O,
		E + O + E + O + O,
		E + O + O + E + O,
		E + O + O + O + E,

		O + E + E + O + O,
		O + E + O + E + O,
		O + E + O + O + E,

		O + O + E + E + O,
		O + O + E + O + E,

		O + O + O + E + E,
	];

	let stringsToCheck = [];

	if (row.length === 6) {
		stringsToCheck.push(row.slice(0,5).join(''));
		stringsToCheck.push(row.slice(1,6).join(''));

		// Check for 4 in a row with open ends.
		let fullRowStr = row.join('');

		if (fullRowStr === (E+C+C+C+C+E)) return 100_000;
		if (fullRowStr === (E+O+O+O+O+E)) return -100_000;
	} else {
		stringsToCheck.push(row.join(''));
	}

	for (let i = 0; i < stringsToCheck.length; ++i) {
		if (stringsToCheck[i] === playerFiveInARow) return Number.MAX_SAFE_INTEGER;
		if (stringsToCheck[i] === opponentFiveInARow) return Number.MIN_SAFE_INTEGER;
	}

	for (let i = 0; i < stringsToCheck.length; ++i) {
		for (let a = 0; a < playerFourInARow.length; ++a) {
			if (stringsToCheck[i] === playerFourInARow[a]) return 1000;
			if (stringsToCheck[i] === opponentFourInARow[a]) return -1000;
		}
	}

	for (let i = 0; i < stringsToCheck.length; ++i) {
		for (let a = 0; a < playerThreeInARow.length; ++a) {
			if (stringsToCheck[i] === playerThreeInARow[a]) return 100;
			if (stringsToCheck[i] === opponentThreeInARow[a]) return -100;
		}
	}

	for (let i = 0; i < stringsToCheck.length; ++i) {
		if (stringsToCheck[i].includes(C + C + C) && stringsToCheck[i].includes(O + O + O)) return 0;
		if (stringsToCheck[i].includes(C + C + C)) return 50;
		if (stringsToCheck[i].includes(O + O + O)) return -50;
	}

	return 0;
}

// let player = 1;
// let testGame = [1,1,1,-1,-1,0];
// let result = GetScoreOfRowV3(testGame, player);
// console.log({testGame, result, player});
// process.exit(123);

function CheckForWin(row, targetColor) {
	let consecutive = 0;

	for (let i = 0; i < row.length; ++i) {
		if (row[i] === targetColor) {
			consecutive++;
		} else {
			if (consecutive >= 5) return true;

			consecutive = 0;
		}
	}

	if (consecutive >= 5) return true;
	return false;
}

const FORCED_LOSS = { [PIECES.WHITE]: {5: {}, 6: {}}, [PIECES.BLACK]: {5: {}, 6: {}} };
const FORCED_PREVENT_FIVE_IN_A_ROW = { [PIECES.WHITE]: {5: {}, 6: {}}, [PIECES.BLACK]: {5: {}, 6: {}} };
const FORCED_PREVENT_FOUR_IN_A_ROW = { [PIECES.WHITE]: {5: {}, 6: {}}, [PIECES.BLACK]: {5: {}, 6: {}} };

for (let a = -1; a <= 1; ++a) {
	for (let b = -1; b <= 1; ++b) {
		for (let c = -1; c <= 1; ++c) {
			for (let d = -1; d <= 1; ++d) {
				for (let e = -1; e <= 1; ++e) {
					let rowInt = convertRowToInt(a, b, c, d, e, 0);
					ROW_SCORE_LOOKUP[PIECES.WHITE][5][rowInt] = GetScoreOfRow([a, b, c, d, e], PIECES.WHITE);
					ROW_SCORE_LOOKUP[PIECES.BLACK][5][rowInt] = GetScoreOfRow([a, b, c, d, e], PIECES.BLACK);
					// console.log([a, b, c, d, e], PIECES.WHITE, ROW_SCORE_LOOKUP[PIECES.WHITE][5][rowInt]);
					
					let whiteForcedMoveScore = GetScoreOfRowV3([a, b, c, d, e], PIECES.WHITE);

					if (whiteForcedMoveScore === Number.MIN_SAFE_INTEGER) FORCED_LOSS[PIECES.WHITE][5][rowInt] = [a,b,c,d,e];
					if (whiteForcedMoveScore === -100_000) FORCED_PREVENT_FIVE_IN_A_ROW[PIECES.WHITE][5][rowInt] = true;
					if (whiteForcedMoveScore === -1_000) FORCED_PREVENT_FIVE_IN_A_ROW[PIECES.WHITE][5][rowInt] = true;
					if (whiteForcedMoveScore === -100) FORCED_PREVENT_FOUR_IN_A_ROW[PIECES.WHITE][5][rowInt] = true;
					
					if (whiteForcedMoveScore === Number.MAX_SAFE_INTEGER) FORCED_LOSS[PIECES.BLACK][5][rowInt] = [a, b, c, d, e];
					if (whiteForcedMoveScore === 100_000) FORCED_PREVENT_FIVE_IN_A_ROW[PIECES.BLACK][5][rowInt] = true;
					if (whiteForcedMoveScore === 1_000) FORCED_PREVENT_FIVE_IN_A_ROW[PIECES.BLACK][5][rowInt] = true;
					if (whiteForcedMoveScore === 100) FORCED_PREVENT_FOUR_IN_A_ROW[PIECES.BLACK][5][rowInt] = true;

					for (let f = -1; f <= 1; ++f) {
						let rowInt = convertRowToInt(a, b, c, d, e, f);
						ROW_SCORE_LOOKUP[PIECES.WHITE][6][rowInt] = GetScoreOfRow([a, b, c, d, e, f], PIECES.WHITE);
						ROW_SCORE_LOOKUP[PIECES.BLACK][6][rowInt] = GetScoreOfRow([a, b, c, d, e, f], PIECES.BLACK);

						let whiteForcedMoveScore = GetScoreOfRowV3([a, b, c, d, e, f], PIECES.WHITE);

						if (whiteForcedMoveScore === Number.MIN_SAFE_INTEGER) FORCED_LOSS[PIECES.WHITE][6][rowInt] = [a, b, c, d, e, f];
						if (whiteForcedMoveScore === -100_000) FORCED_PREVENT_FIVE_IN_A_ROW[PIECES.WHITE][6][rowInt] = true;
						if (whiteForcedMoveScore === -1_000) FORCED_PREVENT_FIVE_IN_A_ROW[PIECES.WHITE][6][rowInt] = true;
						if (whiteForcedMoveScore === -100) FORCED_PREVENT_FOUR_IN_A_ROW[PIECES.WHITE][6][rowInt] = true;

						if (whiteForcedMoveScore === Number.MAX_SAFE_INTEGER) FORCED_LOSS[PIECES.BLACK][6][rowInt] = [a, b, c, d, e, f];
						if (whiteForcedMoveScore === 100_000) FORCED_PREVENT_FIVE_IN_A_ROW[PIECES.BLACK][6][rowInt] = true;
						if (whiteForcedMoveScore === 1_000) FORCED_PREVENT_FIVE_IN_A_ROW[PIECES.BLACK][6][rowInt] = true;
						if (whiteForcedMoveScore === 100) FORCED_PREVENT_FOUR_IN_A_ROW[PIECES.BLACK][6][rowInt] = true;
					}
				}
			}
		}
	}
}

// 2 in a row for each player on separate rows. 
// GamePieces = '-1,1,1,-1,-1,-1,-1,0,0,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1'.split(',').map(x => parseInt(x));

// 3 in a row for each player on separate rows. 
// let TestGamePieces = '-1,1,1,1,-1,-1,-1,0,0,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1'.split(',').map(x => parseInt(x));

function NewIsForcedMoveForPlayer(game, targetColor) {
	let rowInt = 0;

	for (let i = 0; i < ROW_INDICES.length; ++i) {
		rowInt = convertRowToInt(game[ROW_INDICES[i][0]], game[ROW_INDICES[i][1]], game[ROW_INDICES[i][2]], game[ROW_INDICES[i][3]], game[ROW_INDICES[i][4]], game[ROW_INDICES[i][5]]);

		if (FORCED_PREVENT_FOUR_IN_A_ROW[targetColor][6][rowInt]) return true;
		if (FORCED_PREVENT_FIVE_IN_A_ROW[targetColor][6][rowInt]) return true;
		if (FORCED_LOSS[targetColor][6][rowInt]) return true;
	}

	for (let i = 0; i < COL_INDICES.length; ++i) {
		rowInt = convertRowToInt(game[COL_INDICES[i][0]], game[COL_INDICES[i][1]], game[COL_INDICES[i][2]], game[COL_INDICES[i][3]], game[COL_INDICES[i][4]], game[COL_INDICES[i][5]]);
		
		if (FORCED_PREVENT_FOUR_IN_A_ROW[targetColor][6][rowInt]) return true;
		if (FORCED_PREVENT_FIVE_IN_A_ROW[targetColor][6][rowInt]) return true;
		if (FORCED_LOSS[targetColor][6][rowInt]) return true;
	}

	for (let i = 0; i < DIAGONAL_INDICES.length; ++i) {
		if (DIAGONAL_INDICES[i].length === 6) {
			rowInt = convertRowToInt(game[DIAGONAL_INDICES[i][0]], game[DIAGONAL_INDICES[i][1]], game[DIAGONAL_INDICES[i][2]], game[DIAGONAL_INDICES[i][3]], game[DIAGONAL_INDICES[i][4]], game[DIAGONAL_INDICES[i][5]]);
			if (FORCED_PREVENT_FOUR_IN_A_ROW[targetColor][6][rowInt]) return true;
			if (FORCED_PREVENT_FIVE_IN_A_ROW[targetColor][6][rowInt]) return true;
			if (FORCED_LOSS[targetColor][6][rowInt]) return true;
		} else {
			rowInt = convertRowToInt(game[DIAGONAL_INDICES[i][0]], game[DIAGONAL_INDICES[i][1]], game[DIAGONAL_INDICES[i][2]], game[DIAGONAL_INDICES[i][3]], game[DIAGONAL_INDICES[i][4]], 0);
			if (FORCED_PREVENT_FOUR_IN_A_ROW[targetColor][5][rowInt]) return true;
			if (FORCED_PREVENT_FIVE_IN_A_ROW[targetColor][5][rowInt]) return true;
			if (FORCED_LOSS[targetColor][5][rowInt]) return true;
		}
	}

	return false;
}

function NewIsForcedToPreventWin(game, targetColor) {
	let rowInt = 0;

	for (let i = 0; i < ROW_INDICES.length; ++i) {
		rowInt = convertRowToInt(game[ROW_INDICES[i][0]], game[ROW_INDICES[i][1]], game[ROW_INDICES[i][2]], game[ROW_INDICES[i][3]], game[ROW_INDICES[i][4]], game[ROW_INDICES[i][5]]);

		if (FORCED_LOSS[targetColor][6][rowInt]) return true;
		if (FORCED_PREVENT_FIVE_IN_A_ROW[targetColor][6][rowInt]) return true;
	}

	for (let i = 0; i < COL_INDICES.length; ++i) {
		rowInt = convertRowToInt(game[COL_INDICES[i][0]], game[COL_INDICES[i][1]], game[COL_INDICES[i][2]], game[COL_INDICES[i][3]], game[COL_INDICES[i][4]], game[COL_INDICES[i][5]]);

		if (FORCED_LOSS[targetColor][6][rowInt]) return true;
		if (FORCED_PREVENT_FIVE_IN_A_ROW[targetColor][6][rowInt]) return true;
	}

	for (let i = 0; i < DIAGONAL_INDICES.length; ++i) {
		if (DIAGONAL_INDICES[i].length === 6) {
			rowInt = convertRowToInt(game[DIAGONAL_INDICES[i][0]], game[DIAGONAL_INDICES[i][1]], game[DIAGONAL_INDICES[i][2]], game[DIAGONAL_INDICES[i][3]], game[DIAGONAL_INDICES[i][4]], game[DIAGONAL_INDICES[i][5]]);
			if (FORCED_LOSS[targetColor][6][rowInt]) return true;
			if (FORCED_PREVENT_FIVE_IN_A_ROW[targetColor][6][rowInt]) return true;
		} else {
			rowInt = convertRowToInt(game[DIAGONAL_INDICES[i][0]], game[DIAGONAL_INDICES[i][1]], game[DIAGONAL_INDICES[i][2]], game[DIAGONAL_INDICES[i][3]], game[DIAGONAL_INDICES[i][4]], 0);
			if (FORCED_LOSS[targetColor][5][rowInt]) return true;
			if (FORCED_PREVENT_FIVE_IN_A_ROW[targetColor][5][rowInt]) return true;
		}
	}

	return false;
}

function NewIsForcedToPreventFourInARow(game, targetColor) {
	let rowInt = 0;

	for (let i = 0; i < ROW_INDICES.length; ++i) {
		rowInt = convertRowToInt(game[ROW_INDICES[i][0]], game[ROW_INDICES[i][1]], game[ROW_INDICES[i][2]], game[ROW_INDICES[i][3]], game[ROW_INDICES[i][4]], game[ROW_INDICES[i][5]]);

		if (FORCED_PREVENT_FOUR_IN_A_ROW[targetColor][6][rowInt]) return true;
	}

	for (let i = 0; i < COL_INDICES.length; ++i) {
		rowInt = convertRowToInt(game[COL_INDICES[i][0]], game[COL_INDICES[i][1]], game[COL_INDICES[i][2]], game[COL_INDICES[i][3]], game[COL_INDICES[i][4]], game[COL_INDICES[i][5]]);

		if (FORCED_PREVENT_FOUR_IN_A_ROW[targetColor][6][rowInt]) return true;
	}

	for (let i = 0; i < DIAGONAL_INDICES.length; ++i) {
		if (DIAGONAL_INDICES[i].length === 6) {
			rowInt = convertRowToInt(game[DIAGONAL_INDICES[i][0]], game[DIAGONAL_INDICES[i][1]], game[DIAGONAL_INDICES[i][2]], game[DIAGONAL_INDICES[i][3]], game[DIAGONAL_INDICES[i][4]], game[DIAGONAL_INDICES[i][5]]);
			if (FORCED_PREVENT_FOUR_IN_A_ROW[targetColor][6][rowInt]) return true;
		} else {
			rowInt = convertRowToInt(game[DIAGONAL_INDICES[i][0]], game[DIAGONAL_INDICES[i][1]], game[DIAGONAL_INDICES[i][2]], game[DIAGONAL_INDICES[i][3]], game[DIAGONAL_INDICES[i][4]], 0);
			if (FORCED_PREVENT_FOUR_IN_A_ROW[targetColor][5][rowInt]) return true;
		}
	}

	return false;
}

function EvaluateStrength(game, targetColor) {
	let score = 0;
	let tempScore;
	let rowInt = 0;

	for (let i = 0; i < ROW_INDICES.length; ++i) {
		rowInt = convertRowToInt(game[ROW_INDICES[i][0]], game[ROW_INDICES[i][1]], game[ROW_INDICES[i][2]], game[ROW_INDICES[i][3]], game[ROW_INDICES[i][4]], game[ROW_INDICES[i][5]]);
		tempScore = ROW_SCORE_LOOKUP[targetColor][6][rowInt];

		if (tempScore === Number.MAX_SAFE_INTEGER) return tempScore;
		score += tempScore;
	}

	for (let i = 0; i < COL_INDICES.length; ++i) {
		rowInt = convertRowToInt(game[COL_INDICES[i][0]], game[COL_INDICES[i][1]], game[COL_INDICES[i][2]], game[COL_INDICES[i][3]], game[COL_INDICES[i][4]], game[COL_INDICES[i][5]]);
		tempScore = ROW_SCORE_LOOKUP[targetColor][6][rowInt];

		if (tempScore === Number.MAX_SAFE_INTEGER) return tempScore;
		score += tempScore;
	}

	for (let i = 0; i < DIAGONAL_INDICES.length; ++i) {
		if (DIAGONAL_INDICES[i].length === 6) {
			rowInt = convertRowToInt(game[DIAGONAL_INDICES[i][0]], game[DIAGONAL_INDICES[i][1]], game[DIAGONAL_INDICES[i][2]], game[DIAGONAL_INDICES[i][3]], game[DIAGONAL_INDICES[i][4]], game[DIAGONAL_INDICES[i][5]]);
			tempScore = ROW_SCORE_LOOKUP[targetColor][6][rowInt];
		} else {
			rowInt = convertRowToInt(game[DIAGONAL_INDICES[i][0]], game[DIAGONAL_INDICES[i][1]], game[DIAGONAL_INDICES[i][2]], game[DIAGONAL_INDICES[i][3]], game[DIAGONAL_INDICES[i][4]], 0);
			tempScore = ROW_SCORE_LOOKUP[targetColor][5][rowInt];
		}

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
	PrettyResult,
	QuadrantSymmetricWithPiece,
	RotateBoard,
	Evaluate,
	EvaluateStrength,
	NewIsForcedMoveForPlayer,
	NewIsForcedToPreventWin,
	NewIsForcedToPreventFourInARow,
	CountColorsOnRowColDiag,
	CountColorsOnRowColDiagV2,
	ScoreConsecutive,
	IsForcedMoveForPlayer,
	ForcedMoveToStopFourInARowWithOpenEnds,
	ForcedMoveToPreventWin
};