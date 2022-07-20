console.clear();

const PIECES = {EMPTY: -1, BLACK: 0, WHITE: 1};
const PIECES_BINARY_INT_VALUES = {EMPTY: 0n, BLACK: 1n, WHITE: 2n}; // Leave as is!!!

const QUADRANT_INTEGERS = [
	BigInt('0b111111111111111111000000000000000000000000000000000000000000000000000000'),
	BigInt('0b111111111111111111000000000000000000000000000000000000'),
	BigInt('0b111111111111111111000000000000000000'),
	BigInt('0b111111111111111111'),
];
const QUADRANT_REVERSE_INTEGERS = [
	BigInt('0b000000000000000000111111111111111111111111111111111111111111111111111111'),
	BigInt('0b111111111111111111000000000000000000111111111111111111111111111111111111'),
	BigInt('0b111111111111111111111111111111111111000000000000000000111111111111111111'),
	BigInt('0b111111111111111111111111111111111111111111111111111111000000000000000000'),
];
const QUADRANT_ROTATION_BIT_SHIFT_AMOUNT = [54n, 36n, 18n, 0n];

console.log({QUADRANT_REVERSE_INTEGERS});

let FIVE_IN_A_ROW_INDICES = [
	[0,1,2,3,4,5],[6,7,8,9,10,11],[12,13,14,15,16,17],[18,19,20,21,22,23],[24,25,26,27,28,29],[30,31,32,33,34,35],
	[0,6,12,18,24,30],[1,7,13,19,25,31],[2,8,14,20,26,32],[3,9,15,21,27,33],[4,10,16,22,28,34],[5,11,17,23,29,35],
	[6,13,20,27,34],[0,7,14,21,28,35],[1,8,15,22,29],[24,19,14,9,4],[30,25,20,15,10,5],[31,26,21,16,11],
].map(x => {
	if (x.length === 5) return x;
	if (x.length === 6) return [[x[0], x[1], x[2], x[3], x[4]], [x[1], x[2], x[3], x[4], x[5]]];
	return [];
}).reduce((accum, cur) => Array.isArray(cur[0]) ? [...accum, ...cur] : [...accum, cur], []);


let FIVE_IN_A_ROW_WHITE = FIVE_IN_A_ROW_INDICES.map(indexList => {
	return indexList.map(normalGameArrayIndex => {
		let indexMap = [0,1,2,9,10,11, 7,8,3,16,17,12,6,5,4,15,14,13,18,19,20,27,28,29,25,26,21,34,35,30,24,23,22,33,32,31].map(x => 35-x);
		let bigIntValue = 2n << (2n*BigInt(indexMap[normalGameArrayIndex]));

		return bigIntValue;
	}).reduce((accum, cur) => accum | cur, 0n);
});
let FIVE_IN_A_ROW_BLACK = FIVE_IN_A_ROW_WHITE.map(x => x >> 1n);

console.log('FIVE_IN_A_ROW_WHITE');
console.log(FIVE_IN_A_ROW_WHITE);

// console.log(FIVE_IN_A_ROW_WHITE);

const indexMap = [0,1,2,8,14,13,12,6,7, 3,4,5,11,17,16,15,9,10, 18,19,20,26,32,31,30,24,25, 21,22,23,29,35,34,33,27,28];
function ConvertGameArrayToBigInt(game) {

	let gameAsBigInt = (game[0] === PIECES.BLACK ? PIECES_BINARY_INT_VALUES.BLACK : game[0] === PIECES.WHITE ? PIECES_BINARY_INT_VALUES.WHITE : 0n);

	for (let i = 1; i < 36; ++i) {
		gameAsBigInt = gameAsBigInt << 2n;
		if (game[indexMap[i]] === PIECES.BLACK) gameAsBigInt = gameAsBigInt | PIECES_BINARY_INT_VALUES.BLACK;
		else if (game[indexMap[i]] === PIECES.WHITE) gameAsBigInt = gameAsBigInt | PIECES_BINARY_INT_VALUES.WHITE;
	}

	return gameAsBigInt;
}

function GameBigIntToGameArray(gameBigInt) {
	let indexMap = [0,1,2,8,14,13,12,6,7, 3,4,5,11,17,16,15,9,10, 18,19,20,26,32,31,30,24,25, 21,22,23,29,35,34,33,27,28];
	indexMap.reverse();

	let gameArray = [-1,-1,-1,-1,-1,-1,-1,-1,-1, -1,-1,-1,-1,-1,-1,-1,-1,-1, -1,-1,-1,-1,-1,-1,-1,-1,-1, -1,-1,-1,-1,-1,-1,-1,-1,-1];
	let nextValue = gameBigInt & 3n;

	for (let i = 0; i < 36; ++i) {
		gameBigInt = gameBigInt >> 2n;

		if (nextValue === PIECES_BINARY_INT_VALUES.BLACK) gameArray[indexMap[i]] = PIECES.BLACK;
		else if (nextValue === PIECES_BINARY_INT_VALUES.WHITE) gameArray[indexMap[i]] = PIECES.WHITE;
		nextValue = gameBigInt & 3n;
	}

	return gameArray;
}

// game = BigInt - Representation of the Game
// quadrant = Int - Specifies which quadrant to rotate (0,1,2,3) => (TL,TR,BL,BR)
// direction = Boolean - Rotation Direction (false, true) => (left, right)
function RotateGame(game, quadrant, direction) {
	let quadrantInteger = (QUADRANT_INTEGERS[quadrant] & game) >> QUADRANT_ROTATION_BIT_SHIFT_AMOUNT[quadrant];
	let centerValue = quadrantInteger & 3n;
	quadrantInteger = quadrantInteger >> 2n;

	if (direction) quadrantInteger = ((((quadrantInteger >> 4n) | (quadrantInteger << 12n)) & 65535n) << 2n) | centerValue;
	else quadrantInteger = ((((quadrantInteger << 4n) | (quadrantInteger >> 12n)) & 65535n) << 2n) | centerValue;
	// if (direction) quadrantInteger = (_RightRotate(quadrantInteger, 4n) << 2n) | centerValue;
	// else quadrantInteger = (_LeftRotate(quadrantInteger, 4n) << 2n) | centerValue;

	quadrantInteger = quadrantInteger << QUADRANT_ROTATION_BIT_SHIFT_AMOUNT[quadrant];
	quadrantInteger = (game & QUADRANT_REVERSE_INTEGERS[quadrant]) | quadrantInteger;

	return quadrantInteger;
}

let QUADRANT_INDICES = [0,1,2,8,14,13,12,6];
let LEFT_TURN_ADD_AMOUNT = [2,7,12,5,-2,-7,-12,-5]; // Based on the QUADRANT_INDICES Array
let RIGHT_TURN_ADD_AMOUNT = [12,5,-2,-7,-12,-5,2,7]; // Based on the QUADRANT_INDICES Array
let QUADRANT_PLUS_AMOUNTS = [0,3,18,21];

// game = game board
// quadrant = 0,1,2,3 (TL, TR, BL, BR)
// direction = false,true (left, right)
function RotateBoardArray(game, quadrant, direction) {
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

function CheckForWhiteWin(gameBigInt) {
	for (let i = 0; i < FIVE_IN_A_ROW_WHITE.length; ++i) {
		if ((gameBigInt & FIVE_IN_A_ROW_WHITE[i]) === FIVE_IN_A_ROW_WHITE[i]) return true;
	}
	return false;
}

function CheckForBlackWin(gameBigInt) {
	for (let i = 0; i < FIVE_IN_A_ROW_BLACK.length; ++i) {
		if ((gameBigInt & FIVE_IN_A_ROW_BLACK[i]) === FIVE_IN_A_ROW_BLACK[i]) return true;
	}
	return false;
}

function PrintGameArray(gameArray) {
	let row = [''];

	console.log();
	for (let i = 0; i < gameArray.length; ++i) {
		row.push(gameArray[i] === PIECES.BLACK ? 'B' : gameArray[i] === PIECES.WHITE ? 'W' : ' ');
		if (row.length === 7) {
			row.push('');
			console.log(['  ', ' ', ' ',' ',' ',' ',' '].join('___'));
			console.log();
			console.log(row.join(' | '));
			row = [''];
		}
	}
	console.log(['  ', ' ', ' ',' ',' ',' ',' '].join('___'));
	console.log();
}


function RandomBitStringBigInt() {
	let result = [];

	for (let i = 0; i < 72; ++i) {
		if (Math.random() < 0.5) result.push(0);
		else result.push(1);
	}

	return BigInt(`0b${result.join('')}`);
}

let GamePieces = [];
let GamePiecesNumber = 0n;

for (let i = 0; i < 36; ++i) {
	GamePieces.push(-1);
	// GamePieces.push(Math.floor(Math.random()*3 - 1));
}

// GamePieces[0] = PIECES.BLACK;
// GamePieces[1] = PIECES.WHITE;
// GamePieces[2] = PIECES.WHITE;
// GamePieces[3] = PIECES.WHITE;
// GamePieces[4] = PIECES.WHITE;
// GamePieces[5] = PIECES.WHITE;
// GamePieces[24] = PIECES.BLACK;
// GamePieces[30] = PIECES.WHITE;

GamePieces[0] = PIECES.WHITE;
GamePieces[6] = PIECES.WHITE;
GamePieces[7] = PIECES.WHITE;

PrintGameArray(GamePieces);
console.log('*********************************');
// PrintGameArray(GameBigIntToGameArray(ConvertGameArrayToBigInt(GamePieces)));
// console.log('*********************************');
// console.log(GamePieces.toString() === GameBigIntToGameArray(ConvertGameArrayToBigInt(GamePieces)).toString());

GamePiecesNumber = ConvertGameArrayToBigInt(GamePieces);
console.log(GamePiecesNumber);
console.log(GamePiecesNumber.toString(2));

let RotatedBoard = RotateGame(GamePiecesNumber, 0, false);
// console.log(RotatedBoard);
// RotatedBoard = RotateGame(RotatedBoard, 2, true);
// RotatedBoard = RotateGame(RotatedBoard, 2, true);
// RotatedBoard = RotateGame(RotatedBoard, 2, true);
// PrintGameArray(GameBigIntToGameArray(RotatedBoard));


console.log('White wins:', CheckForWhiteWin(GamePiecesNumber));
console.log('Black wins:', CheckForBlackWin(GamePiecesNumber));

// console.log(RandomBitStringBigInt());
// console.log(RandomBitStringBigInt());
// console.log(RandomBitStringBigInt());
// console.log(RandomBitStringBigInt());

let aTime = Date.now();
for (let i = 0; i < 1_000_000; ++i) {
	RotateBoardArray(GamePieces, i%4, !(i%2));
	// GamePiecesNumber = GamePieces.toString();
	// GamePiecesNumber = ConvertGameArrayToBigInt(GamePieces);
	RotatedBoard = RotateGame(RotatedBoard, i%4, !(i%2));
	// CheckForWhiteWin(GamePiecesNumber)
	// CheckForBlackWin(GamePiecesNumber)
}
aTime = Date.now() - aTime;
console.log(aTime);
