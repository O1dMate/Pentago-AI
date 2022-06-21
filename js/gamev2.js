console.clear();

const PIECES = {EMPTY: -1, BLACK: 0, WHITE: 1};
const PIECES_BINARY_INT_VALUES = {EMPTY: 0n, BLACK: 1n, WHITE: 2n};

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

function ConvertGameArrayToBigInt(game) {
	const indexMap = [0,1,2,8,14,13,12,6,7, 3,4,5,11,17,16,15,9,10, 18,19,20,26,32,31,30,24,25, 21,22,23,29,35,34,33,27,28];

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

function _LeftRotate(n,d) {
	let leftRotateValue = (n << d) | (n >> (16n-d));
	return leftRotateValue & 65535n; // To Ensure the values doesn't overflow and is a maximum of 16-bits.
}

function _RightRotate(n,d) {
	let leftRotateValue = (n >> d) | (n << (16n-d));
	return leftRotateValue & 65535n; // To Ensure the values doesn't overflow and is a maximum of 16-bits.
}

// game = BigInt - Representation of the Game
// quadrant = Int - Specifies which quadrant to rotate (0,1,2,3) => (TL,TR,BL,BR)
// direction = Boolean - Rotation Direction (false, true) => (left, right)
function RotateGame(game, quadrant, direction) {
	let quadrantInteger = (QUADRANT_INTEGERS[quadrant] & game) >> QUADRANT_ROTATION_BIT_SHIFT_AMOUNT[quadrant];
	let centerValue = quadrantInteger & 3n;
	quadrantInteger = quadrantInteger >> 2n;

	if (direction) quadrantInteger = (_RightRotate(quadrantInteger, 4n) << 2n) | centerValue;
	else quadrantInteger = (_LeftRotate(quadrantInteger, 4n) << 2n) | centerValue;

	quadrantInteger = quadrantInteger << QUADRANT_ROTATION_BIT_SHIFT_AMOUNT[quadrant];
	quadrantInteger = (game & QUADRANT_REVERSE_INTEGERS[quadrant]) | quadrantInteger;

	return quadrantInteger;
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

let GamePieces = [];
let GamePiecesNumber = 0n;

for (let i = 0; i < 36; ++i) {
	// GamePieces.push(-1);
	GamePieces.push(Math.floor(Math.random()*3 - 1));
}

// GamePieces[0] = PIECES.WHITE;
// GamePieces[1] = PIECES.WHITE;
GamePieces[24] = PIECES.BLACK;
GamePieces[30] = PIECES.WHITE;

// GamePieces[7] = PIECES.WHITE;
// GamePieces[6] = PIECES.WHITE;

PrintGameArray(GamePieces);
console.log('*********************************');
// PrintGameArray(GameBigIntToGameArray(ConvertGameArrayToBigInt(GamePieces)));
// console.log('*********************************');
console.log(GamePieces.toString() === GameBigIntToGameArray(ConvertGameArrayToBigInt(GamePieces)).toString());

GamePiecesNumber = ConvertGameArrayToBigInt(GamePieces);

let RotatedBoard = RotateGame(GamePiecesNumber, 2, true);
// RotatedBoard = RotateGame(RotatedBoard, 2, true);
// RotatedBoard = RotateGame(RotatedBoard, 2, true);
// RotatedBoard = RotateGame(RotatedBoard, 2, true);
PrintGameArray(GameBigIntToGameArray(RotatedBoard));


let aTime = Date.now();
for (let i = 0; i < 1_000_000; ++i) {
	RotatedBoard = RotateGame(RotatedBoard, Math.floor(Math.random()*4), !(i%2));
	// RotateBoard(GamePieces, Math.floor(Math.random()*4), !(i%2));
}
aTime = Date.now() - aTime;
console.log(aTime);