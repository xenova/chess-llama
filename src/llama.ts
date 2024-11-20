import { LlamaForCausalLM, LlamaTokenizer, topk } from '@huggingface/transformers';
import { } from "@huggingface/transformers"
import { Key } from 'chessground/types';

let tokenizer = await LlamaTokenizer.from_pretrained('lazy-guy12/chess-llama');
let model = await LlamaForCausalLM.from_pretrained('lazy-guy12/chess-llama', {device: "wasm", dtype: "q4"});

let k = tokenizer.model.vocab.length
model.generation_config.top_k = k;
model.generation_config.temperature = 0
model.generation_config.max_new_tokens = 1

let mid = 0;

const diffSelector:HTMLSelectElement = document.getElementById("difficulty")! as HTMLSelectElement;
diffSelector.addEventListener("change", () => {
	mid = parseInt(diffSelector.value);
})


export default async function playLlama(moves: string[], dests: Map<Key, Key[]>): Promise<string> {
	let inputs = await tokenizer(moves.join(" "));
	let { logits } = await model(inputs);
	let preds = logits.slice(null, -1, null);


	const [_v, {data}] = await topk(preds, k);

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