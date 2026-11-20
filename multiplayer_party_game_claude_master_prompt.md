# MASTER PROMPT: BUILD A WORLD-CLASS MULTIPLAYER PARTY GAME

You are an elite game development studio consisting of:
- Senior multiplayer game engineers
- Award-winning mobile game designers
- Professional UI/UX designers
- Motion and animation designers
- Game economy and balancing specialists
- Backend and infrastructure engineers

Your mission is to turn my current project into a **premium, commercially polished multiplayer party game**.

This is NOT a prototype, school project, basic Expo demo or generic quiz app.

I want to create a game that feels like a serious contender for Multiplayer Social Game of the Year.

You have creative freedom to make this game extraordinary. Do not limit yourself to my ideas. Improve them, expand them and introduce original mechanics that make the game memorable.

## 1. THE GAME CONCEPT

A multiplayer party game supporting 1–8 players.

Players join a private game room using a unique 4-digit room code.

The objective is to reach 30 points before everyone else.

Every round introduces a different minigame. Players compete against each other, earn points, lose points, unlock streak bonuses and try to become the overall champion.

The game should be:
- Extremely entertaining.
- Competitive.
- Funny and unpredictable.
- Easy to understand.
- Fast-paced.
- Visually impressive.
- Highly replayable.
- Designed around social interaction and friendly trash talk.

The game should feel alive, not like a collection of static screens.

## 2. TECHNOLOGY AND ARCHITECTURE

Use the latest stable versions available when developing.

- Expo with React Native.
- TypeScript.
- Expo Router.
- A reliable real-time multiplayer backend (evaluate Supabase Realtime or another suitable solution).
- Proper server-authoritative game state.
- Persistent player profiles and statistics.
- Scalable room and matchmaking architecture.
- Smooth 60 FPS animations where supported.

Use appropriate libraries for:
- Animations.
- Gestures.
- Sound effects.
- Haptics.
- Particle effects.
- Navigation.
- Icons.
- Multiplayer synchronization.

Do not use outdated packages or deprecated Expo APIs.

First inspect my existing project and preserve useful existing functionality. Do not unnecessarily rebuild working systems.

## 3. MULTIPLAYER SYSTEM

Players should be able to:

1. Create a new game.
2. Receive a randomly generated 4-digit room code.
3. Share that code with friends.
4. Join an existing room using the code.
5. Choose a username and profile avatar.
6. See all players inside the lobby.
7. See who is ready.
8. Start the game when everyone is ready.

Support 1–8 players.

The lobby should look like a premium multiplayer game lobby, with animated player avatars, ready indicators, player cards and a visually impressive background.

Handle:
- Players disconnecting.
- Reconnecting.
- Players joining late.
- Host disconnecting.
- Invalid room codes.
- Duplicate usernames.
- Network interruptions.
- Game synchronization.

Never let clients independently decide official scores or winners.

## 4. THE ROUND SYSTEM

Each round, one player gets to choose a game card.

Display a collection of visually impressive cards with different themes, illustrations, animations and descriptions.

Rotate the card-picker role between players so everyone gets a turn.

After selecting a card, introduce the minigame with a cinematic transition.

Every minigame must have its own identity, gameplay mechanics, animations and sound effects.

## 5. SCORING SYSTEM

The normal minigame scoring system:

| Position | Points |
|---|---:|
| 1st place | +3 |
| 2nd place | +2 |
| 3rd place | +1 |
| Remaining players | 0 |

Important:
- The last-place player ALWAYS receives 0 points in normal competitive minigames.
- Never give last place a positive point reward.
- Display a clear leaderboard after every round.
- First player to reach 30 points wins the entire game.

### Win streak bonuses

A win means finishing in a position that awards points.

Implement streak bonuses:

- 2 consecutive wins: +1 bonus point.
- 3 consecutive wins: +2 bonus points.
- 4 or more consecutive wins: +2 bonus points per winning round.

The bonus should be awarded in addition to the normal round points.

A player who fails to earn points loses their current winning streak.

Make the bonus system clear, visually exciting and properly communicated.

## 6. FULLSCREEN ROUND RESULTS

This is one of the most important parts of the game.

After EVERY round, transition to an impressive fullscreen results presentation.

Show every player's profile prominently.

Each player should have:

- Profile avatar.
- Username.
- Large animated points earned this round.
- Current total points.
- Position in the round.
- Streak information.
- Bonus points, if applicable.

The first-place player should receive a special victory animation.

The last-place player should receive a funny defeat animation.

Use:
- Animated score counters.
- Confetti.
- Screen transitions.
- Particle effects.
- Character reactions.
- Sound effects.
- Highlight animations.

Make the results feel like a major event after every round.

### Dynamic commentary and trash talk

Generate funny contextual messages based on the results.

The game should always praise the winner and tease the last-place player.

Examples:

Winner:
- "{user} is absolutely unstoppable!"
- "{user} has won 3 times in a row. That's what we call a genius move."
- "Someone call the developers. {user} is breaking the game!"
- "{user} didn't come here to play. They came here to dominate."
- "Three wins in a row. Is this even fair anymore?"

Last place:
- "{user} might have participated, but did they actually compete?"
- "{user} is making everyone else look like professionals."
- "{user} has officially entered survival mode."
- "{user} could win a race against themselves and still lose."
- "At least {user} is consistent. Consistently last."

Other examples:
- "The comeback is getting dangerous!"
- "The leaderboard is starting to look personal."
- "Someone needs to stop {user}."
- "This friendship might not survive the next round."

Create a large library of messages.

Messages must be contextual, varied and not repetitive.

Keep the teasing playful, funny and entertaining rather than genuinely offensive.

## 7. MINIGAME CARD LIBRARY

Build the following games and invent additional original minigames.

Every card must have unique gameplay, not just a reskinned quiz.

### CARD 1: MATH QUIZ

Players compete to answer 5 mathematical questions as quickly as possible.

- All players receive the same questions.
- Questions should be randomly generated.
- Difficulty should increase.
- Display a visible timer.
- First player to answer all 5 correctly wins.
- Incorrect answers should have a small penalty or delay.
- Track completion times accurately.

Scoring: Normal 3/2/1/0 scoring.

Make the interface exciting with animated questions, answer buttons, timers and progress indicators.

### CARD 2: ROULETTE

The player who selects this card must play roulette.

This is a special individual challenge.

Display a beautiful animated roulette wheel.

The wheel contains outcomes ranging from -5 to +5.

Possible outcomes include:
- -5
- -4
- -3
- -2
- -1
- 0
- +1
- +2
- +3
- +4
- +5

The player spins the wheel.

The number where the ball lands determines the number of points added or deducted.

All other players watch the spin live.

Important:
- The roulette result must be generated and verified by the server.
- Clearly communicate that this is a special scoring card.
- This card does not use normal placement scoring.
- Do not allow players to manipulate the outcome.

Make the roulette spin spectacular with sound, anticipation, lighting and a dramatic result reveal.

### CARD 3: LABYRINTH

An exciting real-time multiplayer maze race.

All players must escape the same maze.

- Every player has their own visible character.
- Players can see other players moving through the maze in real time.
- Everyone starts simultaneously.
- First player to escape wins.
- Show the other players trying to find their way out.
- Include different maze layouts.
- Add obstacles, dead ends and shortcuts.
- Show player positions on the map.
- Support touch controls and smooth character movement.

Scoring: Normal 3/2/1/0 scoring.

Make this feel like a proper multiplayer arcade game.

### CARD 4: REACTION ROYALE

A reaction-time competition.

Players wait for a visual signal.

When the screen changes, they must tap as quickly as possible.

- Tapping too early results in a penalty.
- Fastest reaction wins.
- Show reaction times in milliseconds.
- Include several rounds with different signal timings.

### CARD 5: MEMORY MELTDOWN

Players must memorize a sequence of symbols, colors or numbers.

The sequence gets increasingly difficult.

- Everyone receives the same sequence.
- Players must reproduce it correctly.
- The fastest accurate player wins.
- Mistakes can eliminate players.

### CARD 6: BLUFF MASTER

Players receive a question with several possible answers.

Each player submits an answer.

Players can attempt to trick other players with believable fake answers.

Everyone votes for the correct answer.

Award points for identifying the truth and successfully fooling other players.

### CARD 7: COLOR CHAOS

A fast-paced color recognition challenge.

Players must select the correct color based on changing instructions.

Sometimes the displayed word and its actual color intentionally contradict each other.

The game should test attention and speed.

### CARD 8: HIGHER OR LOWER

Players predict whether the next number will be higher or lower.

Introduce streaks and increasingly difficult sequences.

The player with the best performance wins.

### CARD 9: BOMB DEFUSE

A multiplayer pressure challenge.

Players must solve a sequence of small puzzles to defuse a bomb.

- Everyone gets the same challenge.
- A countdown timer creates pressure.
- Wrong answers cost time.
- First successful defuse wins.

Use cinematic countdowns and dramatic sound effects.

### CARD 10: THE ODD ONE OUT

Show players a collection of images, symbols or words.

They must identify the one that does not belong.

Difficulty increases with each question.

Fastest correct player wins.

### CARD 11: NUMBER SPRINT

Numbers appear rapidly on the screen.

Players must tap them in the correct order.

Introduce distractions and changing patterns.

### CARD 12: DODGE ARENA

A real-time multiplayer survival minigame.

Players control characters in a small arena.

Avoid moving obstacles and survive longer than everyone else.

The last player standing wins.

### CARD 13: WORD SCRAMBLE

Players receive scrambled words and must solve them.

Use different categories and difficulty levels.

Fastest correct players earn the highest positions.

### CARD 14: TREASURE HUNT

Players explore a shared environment to find hidden treasure.

Include:
- Different paths.
- Hidden clues.
- Traps.
- Decoy treasures.
- Real-time player movement.

First to collect the target treasure wins.

### CARD 15: DANGER DICE

Players take turns rolling dice.

Introduce special multipliers, risky choices and unexpected outcomes.

Players must decide when to take a risk and when to stop.

Create exciting comeback opportunities without making the scoring unfair.

### IMPORTANT MINIGAME REQUIREMENTS

Do not implement all cards as placeholders.

Every released card must be fully playable, tested and connected to the scoring system.

Create a modular minigame architecture so new cards can be added easily.

Each game must have:
- Instructions.
- Countdown.
- Gameplay.
- Completion detection.
- Server-verified results.
- Scoring.
- Results presentation.

## 8. MORE GAME IDEAS

Use your own creativity to develop additional original cards.

I want some minigames that people have never seen before.

Think about:
- Social deception.
- Multiplayer survival.
- Speed competitions.
- Psychological challenges.
- Luck and unpredictability.
- Physical reaction.
- Memory.
- Strategy.
- Cooperation that can turn into betrayal.

Prioritize games that are fun to watch as well as play.

## 9. VISUAL DESIGN AND ART DIRECTION

This is extremely important.

I do not want a generic React Native interface.

I want the quality of a commercially released mobile multiplayer game.

Create a distinctive visual identity.

Explore a premium arcade aesthetic with:
- Deep, atmospheric backgrounds.
- Vibrant accent colors.
- Beautiful gradients.
- Glass-like surfaces.
- Rich character illustrations.
- Custom avatars.
- Animated game cards.
- Dynamic lighting.
- Depth and shadows.
- Smooth transitions.
- Cinematic score reveals.
- Premium typography.

Do not make every screen look like a dashboard.

Every screen should feel intentionally designed.

Create a coherent design system with:
- Typography.
- Colors.
- Spacing.
- Buttons.
- Cards.
- Player profiles.
- Animations.
- Icons.
- Backgrounds.

Use custom graphics and illustrations where appropriate.

Find or generate appropriate assets. Do not leave placeholder images, emojis or generic empty boxes where proper visual assets are needed.

Use professional icon libraries.

## 10. ANIMATIONS AND AUDIO

Animations are essential.

Use high-quality motion design throughout the application.

Examples:
- Animated lobby entrances.
- Character idle animations.
- Card selection effects.
- Card flipping.
- Screen transitions.
- Countdown animations.
- Animated score counters.
- Confetti.
- Roulette spinning.
- Maze movement.
- Player elimination.
- Winner celebrations.
- Losing reactions.

Add sound effects for:
- Buttons.
- Countdown.
- Correct answers.
- Wrong answers.
- Winning.
- Losing.
- Roulette.
- Game transitions.
- Score increases.

Include music settings and sound controls.

Use haptic feedback where appropriate.

Animations should feel responsive and intentional, never excessive or distracting.

## 11. PLAYER PROFILES AND STATISTICS

Create persistent player profiles.

Track:
- Username.
- Avatar.
- Total games played.
- Total wins.
- Total points earned.
- Best winning streak.
- Current winning streak.
- Favorite minigame.
- Individual minigame statistics.
- Win percentage.

Create a player profile screen with a beautiful visual presentation.

Consider unlockable avatars, titles, badges and achievements.

## 12. FINAL GAME VICTORY

The first player to reach 30 points wins the entire game.

Create an unforgettable final victory presentation.

Include:
- Fullscreen winner reveal.
- Animated podium.
- Confetti and fireworks.
- Final leaderboard.
- Winner profile.
- Final scores.
- Game statistics.
- Funny commentary about the winner and losers.

Allow players to:
- Rematch.
- Return to lobby.
- Start a new game.

## 13. QUALITY ASSURANCE

Do not stop when the application merely runs.

Test the complete multiplayer experience.

Test:
- 1 player.
- 2 players.
- 4 players.
- 8 players.
- Simultaneous answers.
- Different connection speeds.
- Disconnections.
- Reconnection.
- Room code collisions.
- Host disconnection.
- Score synchronization.
- Winning streak calculations.
- Bonus points.
- Negative roulette scores.
- Reaching 30 points.
- All minigames.

Prevent:
- Duplicate score awards.
- Client-side score manipulation.
- Race conditions.
- Players receiving different questions unintentionally.
- Incorrect placement calculations.
- Multiple winners caused by simultaneous submissions.

Build automated tests for important scoring and multiplayer logic.

## 14. HOW YOU SHOULD WORK

Work like a professional game studio.

### PHASE 1: AUDIT
- Inspect the complete existing project.
- Understand the architecture.
- Identify what already works.
- Identify what needs improvement.
- Present a concise implementation plan.

### PHASE 2: FOUNDATION
- Establish the design system.
- Implement multiplayer rooms.
- Implement player profiles.
- Implement authoritative scoring.
- Implement the round lifecycle.

### PHASE 3: GAMEPLAY
- Build the minigame framework.
- Implement the requested cards.
- Create additional original cards.
- Connect every game to multiplayer and scoring.

### PHASE 4: VISUAL POLISH
- Implement custom assets.
- Add animations.
- Add sound.
- Improve every screen.
- Create the cinematic results and victory experiences.

### PHASE 5: TESTING
- Test multiplayer scenarios.
- Fix bugs.
- Optimize performance.
- Verify the scoring system.
- Test on actual devices.

### PHASE 6: FINALIZATION
- Ensure the project builds.
- Ensure the backend works.
- Document environment variables.
- Document how to run the game.
- Document how to deploy the backend.
- Provide a clear list of completed and remaining features.

### CRITICAL INSTRUCTIONS

1. Do not deliver a prototype and call it finished.
2. Do not replace real multiplayer with simulated players.
3. Do not use fake results to make the interface look functional.
4. Do not leave buttons that do nothing.
5. Do not leave minigame cards as visual placeholders.
6. Do not sacrifice gameplay quality for the number of minigames.
7. Prioritize a smaller number of exceptionally polished games over many broken games.
8. Make smart technical decisions independently.
9. Find suitable images, sound effects, icons and other assets yourself.
10. Create original visual assets when existing assets are insufficient.
11. Use the latest stable Expo-compatible technologies.
12. Keep the application maintainable and modular.

**THE ULTIMATE GOAL:**

I want people to open this game with their friends and immediately say:

"WHAT IS THIS GAME?!"

I want them laughing, competing, trash-talking, celebrating and immediately wanting another round.

Make something genuinely special.

Do not just build an app. Build a multiplayer gaming experience people want to come back to.

---

# ADDITIONAL CREATIVE RECOMMENDATIONS

These are extra features to consider while building the game.

## 1. Animated player characters

Instead of just profile pictures, give everyone a 3D-style or illustrated character that reacts to winning, losing and getting eliminated.

## 2. Chaos cards

Add cards that can change the leaderboard, steal points, double points or swap positions. Make every round unpredictable.

## 3. Personal rivalries

Track who beats whom. Display messages like "Player A has beaten Player B 5 times. This rivalry is getting embarrassing."

## 4. Mystery cards

Introduce hidden cards where players don't know what challenge they're selecting until the animation reveals it.

## IMPLEMENTATION PRIORITY

Build the multiplayer infrastructure and scoring system before adding a large number of minigames.

Aim for five exceptionally polished, fully playable minigames first, then expand the library. The game should feel finished even with only those five.
