import { ComponentType } from "react";
import { MemoryMatch } from "./MemoryMatch";
import { BalloonPop } from "./BalloonPop";
import { CountingStars } from "./CountingStars";
import { BigOrSmall } from "./BigOrSmall";
import { OddOneOut } from "./OddOneOut";
import { ShapeMatch } from "./ShapeMatch";
import { PatternRepeat } from "./PatternRepeat";
import { ColorTap } from "./ColorTap";
import { BubbleWrap } from "./BubbleWrap";
import { TapTheLetter } from "./TapTheLetter";
import { AnimalCount } from "./AnimalCount";
import { TapTheNumber } from "./TapTheNumber";

export interface GameMeta {
  slug: string;
  title: string;
  emoji: string;
  blurb: string;
  Component: ComponentType;
}

export const GAMES: GameMeta[] = [
  { slug: "memory-match", title: "Memory Match", emoji: "\uD83E\uDDE0", blurb: "Flip and find the matching pairs", Component: MemoryMatch },
  { slug: "balloon-pop", title: "Balloon Pop", emoji: "\uD83C\uDF88", blurb: "Tap the balloons before they float away", Component: BalloonPop },
  { slug: "counting-stars", title: "Counting Stars", emoji: "\u2B50", blurb: "How many stars can you count?", Component: CountingStars },
  { slug: "big-or-small", title: "Big or Small", emoji: "\uD83D\uDC18", blurb: "Compare the two and pick the right one", Component: BigOrSmall },
  { slug: "odd-one-out", title: "Odd One Out", emoji: "\uD83D\uDD0D", blurb: "Find the one that does not belong", Component: OddOneOut },
  { slug: "shape-match", title: "Shape Match", emoji: "\uD83D\uDD37", blurb: "Match the shapes together", Component: ShapeMatch },
  { slug: "pattern-repeat", title: "Pattern Repeat", emoji: "\uD83D\uDD34", blurb: "What color comes next?", Component: PatternRepeat },
  { slug: "color-tap", title: "Color Tap", emoji: "\uD83C\uDFA8", blurb: "Tap the balloon with the right color", Component: ColorTap },
  { slug: "bubble-wrap", title: "Bubble Wrap", emoji: "\uD83E\uDEE7", blurb: "Pop every bubble. It feels great.", Component: BubbleWrap },
  { slug: "tap-the-letter", title: "Tap the Letter", emoji: "\uD83D\uDD24", blurb: "Find the letter that is asked", Component: TapTheLetter }
  ,{ slug: "animal-count", title: "Animal Count", emoji: "\uD83D\uDC3E", blurb: "Count the animals and pick the number", Component: AnimalCount }
  ,{ slug: "tap-the-number", title: "Tap the Number", emoji: "\uD83D\uDD22", blurb: "Find the number that is asked", Component: TapTheNumber }
];

export function getGame(slug: string): GameMeta | undefined {
  return GAMES.find((g) => g.slug === slug);
}