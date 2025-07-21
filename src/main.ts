import './style.css'
import { Chessground } from 'chessground'
import { Chess, Move, SQUARES } from 'chess.js'

import { Key, Piece } from 'chessground/types';
import "/node_modules/chessground/assets/chessground.base.css"
import "/node_modules/chessground/assets/chessground.brown.css"
import "/node_modules/chessground/assets/chessground.cburnett.css"
import playLlama from './llama';

let player: "white" | "black" = "white"

function showResult(chess: Chess) {
  if (chess.isCheckmate()) {
    setTimeout(() => {
      alert((chess.turn() == player.charAt(0) ? "Llama" : " You") + " Won!")
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

const moves: string[] = [];

const movesContainer = document.getElementById("moves")!;

function movesRowBuilder(move: Move) {
  const moveDiv = document.createElement("div");
  moveDiv.classList.add("move-san");
  moveDiv.innerText = move.san;
  let lastRow = movesContainer.querySelector(".move:last-of-type")
  if (lastRow !== null && lastRow.childElementCount === 2) {
    lastRow.appendChild(moveDiv);
  } else {
    const row = document.createElement("div")
    row.classList.add("move")

    const index = document.createElement("div");
    index.classList.add("move-index");
    index.innerText = `${Math.floor(moves.length / 2)}`;

    row.append(index, moveDiv);
    lastRow = row;
    movesContainer.appendChild(row);
  }
}

const promotionDialog = document.getElementById("promotionDialog")! as HTMLDialogElement;

function showPromotionDialog(): Promise<string> {
  return new Promise((resolve) => {
    promotionDialog.showModal();

    const buttons = promotionDialog.querySelectorAll("button");
    buttons.forEach(button => {
      button.onclick = () => {
        promotionDialog.close();
        resolve(button.value!);
      }
    });
  });
}

function check(): boolean | "white" | "black" {
  return chess.isCheck() ? chess.turn() === "w" ? "white" : "black" : false;
}

async function llamaMove() {
  const dests = getValidMap(chess);
  const move = await playLlama(moves, dests);
  console.log(move);
  moves.push(move);
  let oppMove = chess.move(move);

  movesRowBuilder(oppMove);

  cg.set({
    fen: chess.fen(),
    movable: {
      color: player,
      free: false,
      dests: getValidMap(chess)
    },
    turnColor: player,
    check: check()
  });

  if (chess.isGameOver()) {
    showResult(chess);
  }
}

const cg = Chessground(document.getElementById("app")!, {
  coordinatesOnSquares: true,
  movable: {
    color: player,
    free: false,
    dests: getValidMap(chess),
    events: {
      after: async (orig, dest) => {
        let piece = cg.state.pieces.get(dest);
        let playerMove: Move;

        if (isPromotion(dest, piece!)) {
          let promotion = await showPromotionDialog();
          playerMove = chess.move({ from: orig, to: dest, promotion: promotion })
          moves.push(orig + dest + "q");
        } else {
          playerMove = chess.move({ from: orig, to: dest })
          moves.push(orig + dest);
        }

        movesRowBuilder(playerMove);

        cg.set({
          fen: chess.fen(),
          turnColor: player == "white" ? "black" : "white",
          check: check()
        });

        if (chess.isGameOver()) {
          showResult(chess);
          return;
        }

        llamaMove();
      }
    }
  },
  fen: chess.fen(),
  check: check(),
  highlight: {
    check: true
  }
})

document.getElementById("undo")!.onclick = async () => {
  let popCount = 0;
  if (player === "white") {
    popCount = ((moves.length - 1) % 2) === 1 ? 1 : 2;
  } else {
    popCount = ((moves.length - 1) % 2) === 0 ? 1 : 2;
  }

  while (popCount--) {
    let lastMove = movesContainer.querySelector(".move:last-of-type");
    if (lastMove === null) break;

    let lastHalfMove = lastMove?.querySelector(".move-san:last-of-type");
    if (lastHalfMove !== null) {
      chess.undo();
      moves.pop();
      lastMove?.removeChild(lastHalfMove);
    }
    if (lastMove?.childElementCount === 1) {
      movesContainer.removeChild(lastMove);
    }
  }

  cg.set({
    fen: chess.fen(),
    viewOnly: false, movable: {
      color: player,
      free: false,
      dests: getValidMap(chess)
    },
    check: check(),
    turnColor: player,
  });

  if (moves.length === 1 && player === "black") {
    llamaMove();
  }
}

async function initGame(playerColor: "white" | "black", state: string[]) {
  chess.reset();
  moves.splice(0, moves.length);
  let promotionOptions = promotionDialog.getElementsByClassName("piece")!;

  player = playerColor;

  if (player === "white") {
    moves.push("0-1");
    for (let option of promotionOptions) {
      option.classList.remove("black");
    }
  } else {
    moves.push("1-0");
    for (let option of promotionOptions) {
      option.classList.add("black");
    }
  }

  for (let move of state) {
    moves.push(move);
    let m = chess.move(move);
    movesRowBuilder(m);
  }

  cg.set({
    orientation: player,
    fen: chess.fen(),
    turnColor: player,
    movable: {
      color: player,
      free: false,
      dests: getValidMap(chess)
    },
    check: check(),
  })

  if (player === "black" && (state.length % 2) === 0) {
    llamaMove();
  }
}

// initGame("black", ["e2e4", "g8f6", "b1c3", "d7d5", "e4e5", "d5d4", "e5f6", "d4c3", "d2d4", "c3b2", "f6g7",])

const colorDialog = document.getElementById("colorDialog")! as HTMLDialogElement;
const blackButton = document.getElementById("blackSelection")! as HTMLButtonElement;
const whiteButton = document.getElementById("whiteSelection")! as HTMLButtonElement;

blackButton.onclick = () => {
  colorDialog.close();
  colorDialog.returnValue = "black";
  initGame("black", []);
}
whiteButton.onclick = () => {
  colorDialog.close();
  colorDialog.returnValue = "white";
  initGame("white", []);
}

function startGame() {
  colorDialog.showModal();
}

startGame();