import './style.css'
import { Chessground } from 'chessground'
import { Chess, SQUARES } from 'chess.js'

import { Key, Piece } from 'chessground/types';
import "/node_modules/chessground/assets/chessground.base.css"
import "/node_modules/chessground/assets/chessground.brown.css"
import "/node_modules/chessground/assets/chessground.cburnett.css"
import playLlama from './llama';


function showResult(chess: Chess) {
  if(chess.isCheckmate()) {
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
    const ms = chess.moves({square: s, verbose: true});
    if (ms.length) dests.set(s, ms.map(m => m.to));
  });
  return dests;

}

const isPromotion = (orig: Key, dest: Key, piece: Piece): boolean => {
  return (
    piece.role == "pawn" &&
    ((piece.color == "white" && dest[1] == "8") ||
      (piece.color == "black" && dest[1] == "1"))
  );
};


const chess = new Chess();
const moves: string[] = ["0-1"];


const cg = Chessground(document.getElementById("app")!, {
  orientation: 'white',
  coordinatesOnSquares: true,
  movable: {
    color: "white",
    free: false,
    dests: getValidMap(chess),
    events: {
      after: async (orig, dest, metadata) => {
        if(chess.isGameOver()) {
          cg.set({
            viewOnly: true
          })
          showResult(chess);
          return;
        }
        let piece = cg.state.pieces.get(dest);

        if(isPromotion(orig, dest, piece!)) {
          chess.move({from: orig, to: dest, promotion: "q"})
          moves.push(orig + dest + "q");
        } else {
          chess.move({from: orig, to: dest})
          moves.push(orig + dest);
        }

        const dests = getValidMap(chess)
        const llamaMove = await playLlama(moves, dests);
        moves.push(llamaMove);
        chess.move(llamaMove);
        cg.set({
          fen: chess.fen(), movable: {
            color: "white",
            free: false,
            dests: getValidMap(chess)
          },
          turnColor: "white",
        });

        if(chess.isGameOver()) {
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