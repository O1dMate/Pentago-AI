let ArrayToBigInt = BigInt(0);

function ConvertToBigInt(game) {
	ArrayToBigInt = 0n;

	for (let i = 0; i < 36; ++i) {

		if (game[i] === 0) ArrayToBigInt = ArrayToBigInt | 1n;
		else if (game[i] === 1) ArrayToBigInt = ArrayToBigInt | 2n;

		ArrayToBigInt = (ArrayToBigInt << 2n);
	}

	return ArrayToBigInt;
}

let game;
let history = new Map();

let time = Date.now();
for (let i = 0; i < 1_000_000; ++i) {
	game = [];
	for (let x = 0; x < 36; ++x) {
		game.push(Math.floor(Math.random()*3)-1);
	}

	// if (i < 2) {
	// 	console.log(game);
	// 	console.log(ConvertToBigInt(game));
	// }

	// Method 1
	// let str = game.toString() + i;
	// history.set(str, [i, i]);

	// Method 2
	history.set(ConvertToBigInt(game), [i,i]);
}
time = Date.now() - time;

console.log('msTime', time);
console.log('size', history.size);