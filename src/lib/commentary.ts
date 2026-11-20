/**
 * Trash-talk commentary generator.
 * Produces funny contextual messages for round results and the final victory screen.
 */

type Context =
  | { type: 'winner'; username: string; streak: number }
  | { type: 'loser'; username: string }
  | { type: 'streak'; username: string; streak: number }
  | { type: 'general' }
  | { type: 'final_win'; winner: string; loser: string };

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getCommentary(ctx: Context): string {
  switch (ctx.type) {
    case 'winner': {
      const { username: u, streak } = ctx;
      if (streak >= 4) {
        return pick([
          `Someone stop ${u} before it's too late!`,
          `${u} is on a ${streak}-win streak. This is getting embarrassing for everyone else.`,
          `Four wins and counting. ${u} didn't come here to play. They came to destroy.`,
          `Is anyone even trying to stop ${u}? Anyone?`,
        ]);
      }
      if (streak === 3) {
        return pick([
          `${u} has won 3 times in a row. That's what we call a genius move.`,
          `Someone call the developers. ${u} is breaking the game!`,
          `Three wins in a row. Is this even fair anymore?`,
          `${u} said "one more win" three rounds ago and hasn't stopped.`,
        ]);
      }
      if (streak === 2) {
        return pick([
          `${u} is on a roll!`,
          `Two in a row for ${u}. The comeback is getting dangerous!`,
          `${u} is making everyone else look like beginners.`,
        ]);
      }
      return pick([
        `${u} is absolutely unstoppable!`,
        `${u} didn't come here to play. They came here to dominate.`,
        `${u} takes the round. The leaderboard is starting to look personal.`,
        `That's how it's done. ${u} shows everyone how it's done.`,
        `${u} securing the bag one round at a time.`,
      ]);
    }

    case 'loser': {
      const { username: u } = ctx;
      return pick([
        `${u} might have participated, but did they actually compete?`,
        `${u} is making everyone else look like professionals.`,
        `${u} has officially entered survival mode.`,
        `${u} could win a race against themselves and still lose.`,
        `At least ${u} is consistent. Consistently last.`,
        `${u} gave it 100%... unfortunately 100% wasn't enough.`,
        `${u}'s performance this round should be studied by science.`,
        `${u} is single-handedly keeping everyone else's confidence alive.`,
        `The real question is: is ${u} even trying?`,
      ]);
    }

    case 'streak': {
      const { username: u, streak } = ctx;
      return pick([
        `${u}'s streak of ${streak} is making this friendship complicated.`,
        `This rivalry is getting personal. ${u} won't stop.`,
        `Someone needs to stop ${u}. Anyone. Please.`,
      ]);
    }

    case 'general':
      return pick([
        'The leaderboard is starting to look personal.',
        'This friendship might not survive the next round.',
        'The comeback is getting dangerous!',
        'Every round counts. Focus!',
        'Things are heating up!',
        'Nobody is safe right now.',
        'The gap is closing. Watch out.',
      ]);

    case 'final_win': {
      const { winner, loser } = ctx;
      return pick([
        `${winner} wins! ${loser} has been absolutely humiliated.`,
        `${winner} is the MultiChallenge champion! ${loser} should seriously reconsider their life choices.`,
        `GG! ${winner} dominated while ${loser} struggled to keep up from the start.`,
        `${winner} reached 30 points first! ${loser} is still counting on their fingers.`,
      ]);
    }
  }
}
