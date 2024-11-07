# Chess-Llama
We trained a tiny Llama-based decoder-only transformer model for chess play, consisting of 23M parameters. The model is trained on a 3 million high-quality chess games from the Lichess Elite Database, on a single Nvidia L4 GPU for 18 hours, using the Google Cloud’s Vertex AI platform.

It uses the UCI format for input and output. It has been trained with the token indicating result appended to the beginning of the games, hoping it would improve performance during actual chess play. The model achieves an estimated Elo rating of 1400, and easily outperforms Skill-level 0 Stockfish.

[View on Huggingface](https://huggingface.co/lazy-guy12/chess-llama)

# Web Version
This model can be run within a browser, thanks to Huggingface transformers.js!
You can try it [here](https://lazy-guy.github.io/chess-llama)
(Needs some work related to promotion handling, fix will be pushed within 1-2 days)