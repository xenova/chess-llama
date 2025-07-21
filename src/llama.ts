import { LlamaForCausalLM, LlamaTokenizer, topk } from '@huggingface/transformers';
import { } from "@huggingface/transformers"
import { Key } from 'chessground/types';

let tokenizer = await LlamaTokenizer.from_pretrained('lazy-guy12/chess-llama');
let model = await LlamaForCausalLM.from_pretrained('lazy-guy12/chess-llama', {device: "wasm", dtype: "q4"});

let k = tokenizer.model.vocab.length

let mid = 0;

const diffSelector:HTMLSelectElement = document.getElementById("difficulty")! as HTMLSelectElement;
diffSelector.addEventListener("change", () => {
	mid = parseInt(diffSelector.value);
})

async function wait(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}


export default async function playLlama(moves: string[], dests: Map<Key, Key[]>): Promise<string> {
	const start = performance.now();
	let inputs = await tokenizer(moves.join(" "));
	let { logits } = await model(inputs);
	let preds = logits.slice(null, -1, null);


	const [_v, {data}] = await topk(preds, k);
	const end = performance.now();
	console.log(`Inference took ${end - start} ms`);

	if(end - start < 1000) {
		await wait(1000 - (end - start));
	}

	let move: string = "0000";

	for(let i = mid; i >= 0; i--) {
		move = tokenizer.decode([data[i]]);
		if (move.length >= 4) {
			let s = move.substring(0, 2) as Key
			let e = move.substring(2, 4) as Key
			if(dests.has(s)) {
				if(dests.get(s)?.includes(e)) {
					break;
				}
			}
		}
	}

	if(move != "0000")
		return move;

	for (let i = mid + 1; i < data.length; i++) {
		move = tokenizer.decode([data[i]]);
		if (move.length >= 4) {
			let s = move.substring(0, 2) as Key
			let e = move.substring(2, 4) as Key
			if(dests.has(s)) {
				if(dests.get(s)?.includes(e)) {
					break;
				}
			}
		}
	}

	return move
}