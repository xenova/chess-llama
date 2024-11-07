import { LlamaForCausalLM, LlamaTokenizer, topk } from '@huggingface/transformers';
import { } from "@huggingface/transformers"
import { Key } from 'chessground/types';

let tokenizer = await LlamaTokenizer.from_pretrained('lazy-guy12/chess-llama');
let model = await LlamaForCausalLM.from_pretrained('lazy-guy12/chess-llama', {device: "wasm", dtype: "q4"});

let k = tokenizer.model.vocab.length
model.generation_config.top_k = k;
model.generation_config.temperature = 0
model.generation_config.max_new_tokens = 1


export default async function playLlama(moves: string[], dests: Map<Key, Key[]>): Promise<string> {
	let inputs = await tokenizer(moves.join(" "));
	let { logits } = await model(inputs);
	let preds = logits.slice(null, -1, null);


	const [_v, i] = await topk(preds, k);

	let move: string = "0000";
	let iter = 1;

	for (let id of i.data) {
		move = tokenizer.decode([id]);
		if (move.length >= 4) {
			let s = move.substring(0, 2) as Key
			let e = move.substring(2, 4) as Key
			if(dests.has(s)) {
				if(dests.get(s)?.includes(e)) {
					break;
				}
			}
		}
		iter++;
	}

	console.log(iter, move)

	return move
}