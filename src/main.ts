import './style.css'
import { Chessground } from 'chessground'
import { Chess, Move, SQUARES } from 'chess.js'

import { Key, Piece } from 'chessground/types';
import "/node_modules/chessground/assets/chessground.base.css"
import "/node_modules/chessground/assets/chessground.brown.css"
import "/node_modules/chessground/assets/chessground.cburnett.css"
import playLlama from './llama';


function showResult(chess: Chess) {
  if (chess.isCheckmate()) {
    setTimeout(() => {
      alert((chess.turn() == 'w' ? "Llama" : " You") + " Won!")
    }, 1500)
  } else {
    setTimeout(() => {
      alert("It's a draw!")
    }, 1500)
  }
}


function getValidMap(chess: Chess): Map<Key, Key[]> {
  const dests = new Map();
  SQUARES.forEach(s => {
    const ms = chess.moves({ square: s, verbose: true });
    if (ms.length) dests.set(s, ms.map(m => m.to));
  });
  return dests;

}

const isPromotion = (dest: Key, piece: Piece): boolean => {
  return (
    piece.role == "pawn" &&
    ((piece.color == "white" && dest[1] == "8") ||
      (piece.color == "black" && dest[1] == "1"))
  );
};


const chess = new Chess();
const moves: string[] = ["0-1"];


const movesContainer = document.getElementById("moves");


function movesRowBuilder(move: Move) {
  const row = document.createElement("div")
  row.classList.add("move")

  const index = document.createElement("div");
  index.classList.add("move-index");
  index.innerText = `${Math.floor(moves.length / 2)}`;

  const whiteMove = document.createElement("div");
  whiteMove.classList.add("move-san");
  whiteMove.innerText = move.san;

  const blackMove = document.createElement("div");
  blackMove.classList.add("move-san");

  row.append(index, whiteMove, blackMove);

  movesContainer?.appendChild(row);

  return blackMove;
}



const cg = Chessground(document.getElementById("app")!, {
  orientation: 'white',
  coordinatesOnSquares: true,
  movable: {
    color: "white",
    free: false,
    dests: getValidMap(chess),
    events: {
      after: async (orig, dest) => {
        let piece = cg.state.pieces.get(dest);
        let whiteM: Move;

        if (isPromotion(dest, piece!)) {
          whiteM = chess.move({ from: orig, to: dest, promotion: "q" })
          moves.push(orig + dest + "q");
        } else {
          whiteM = chess.move({ from: orig, to: dest })
          moves.push(orig + dest);
        }

        const blackMove = movesRowBuilder(whiteM);

        if (chess.isGameOver()) {
          cg.set({
            viewOnly: true
          })
          showResult(chess);
          return;
        }

        const dests = getValidMap(chess)
        const llamaMove = await playLlama(moves, dests);
        moves.push(llamaMove);
        let blackM = chess.move(llamaMove);

        blackMove.innerText = blackM.san
        cg.set({
          fen: chess.fen(), movable: {
            color: "white",
            free: false,
            dests: getValidMap(chess)
          },
          turnColor: "white",
        });

        if (chess.isGameOver()) {
          cg.set({
            viewOnly: true
          })
          showResult(chess);
          return;
        }
      }
    }
  }
})


document.getElementById("undo")!.onclick = () => {
  const lastMove = document.querySelector(".move:last-of-type");
  if (lastMove) {
    movesContainer?.removeChild(lastMove);
    chess.undo()
    moves.pop()
    chess.undo()
    moves.pop()
    cg.set({
      fen: chess.fen(), movable: {
        color: "white",
        free: false,
        dests: getValidMap(chess)
      },
      turnColor: "white",
    });
  }
}