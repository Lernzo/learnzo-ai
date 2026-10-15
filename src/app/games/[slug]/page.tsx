import { notFound } from "next/navigation";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { GAMES, getGame } from "@/components/games/registry";
import { KidsGate } from "@/components/games/KidsGate";

export function generateStaticParams() {
  return GAMES.map((g) => ({ slug: g.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const g = getGame(params.slug);
  return {
    title: g ? g.title : "Game",
    description: g ? g.blurb + " Free online game for kids on Learnzo." : undefined
  };
}

export default function GamePage({ params }: { params: { slug: string } }) {
  const game = getGame(params.slug);
  if (!game) notFound();
  const Comp = game.Component;

  return (
    <>
      <Nav />
      <main className="container-x py-8 lg:py-10">
        <KidsGate source="games">
          <Comp />
        </KidsGate>
      </main>
      <Footer />
    </>
  );
}