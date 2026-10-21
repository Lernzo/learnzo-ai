import Link from "next/link";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

const steps = [
  { number: "01", icon: "↗", title: "Bring your question", description: "Snap a photo, upload a PDF, or simply type what you're stuck on.", color: "peach" },
  { number: "02", icon: "✳", title: "See the thinking", description: "Follow a clear, bite-sized explanation that shows you how to get there.", color: "lavender" },
  { number: "03", icon: "✓", title: "Make it stick", description: "Try a similar question and build confidence one step at a time.", color: "mint" },
];

const subjects = [
  { icon: "∑", title: "Mathematics", detail: "From fractions to formulas", color: "subject-orange" },
  { icon: "⚗", title: "Science", detail: "Explore the why behind it", color: "subject-purple" },
  { icon: "Aa", title: "English", detail: "Words, writing & more", color: "subject-green" },
  { icon: "</>", title: "Computer Science", detail: "Code that finally clicks", color: "subject-blue" },
];

export default function HomePage() {
  return (
    <>
      <Nav />
      <main className="landing">
        <section className="hero-section">
          <div className="hero-glow" aria-hidden="true" />
          <div className="container-x hero-grid">
            <div className="hero-copy">
              <span className="eyebrow"><span className="eyebrow-star">✦</span> THE SMARTER WAY TO STUDY</span>
              <h1>That <em>“aha!”</em> moment starts here.</h1>
              <p className="hero-description">Homework help that helps you <strong>understand.</strong> Get unstuck with step-by-step explanations made for the way you learn.</p>
              <div className="hero-actions">
                <Link href="/solve" className="landing-button primary">Start learning for free <span aria-hidden="true">↗</span></Link>
                <Link href="#how-it-works" className="landing-button secondary">See how it works <span aria-hidden="true">↓</span></Link>
              </div>
              <p className="hero-note"><span aria-hidden="true">✓</span> Free to get started <span className="note-dot">·</span> No credit card needed</p>
            </div>
            <div className="hero-art" aria-label="Example of a Learnzo step-by-step math explanation">
              <div className="orbit orbit-one" /><div className="orbit orbit-two" />
              <div className="floating-spark spark-one">✳</div><div className="floating-spark spark-two">✦</div>
              <div className="floating-tag tag-top"><span>✦</span> Learning feels good</div>
              <div className="demo-card">
                <div className="demo-header"><span className="demo-logo">✳</span><span>Let&apos;s figure this out</span><span className="demo-dots">•••</span></div>
                <div className="question-label">YOUR QUESTION <span>MATHEMATICS</span></div>
                <div className="question-box">What is <strong>¾ + ½</strong> ?</div>
                <div className="answer-heading"><span className="answer-icon">✦</span> Let&apos;s break it down</div>
                <div className="solution-line"><span className="step-bubble">1</span><span>Give both fractions the same denominator.</span></div>
                <div className="math-line">¾ + ²⁄₄ = ⁵⁄₄</div>
                <div className="solution-line"><span className="step-bubble">2</span><span>That&apos;s <strong>1¼</strong> — you got it!</span></div>
                <div className="demo-footer"><span>✳</span> Try a similar question <span>→</span></div>
              </div>
              <div className="floating-tag tag-bottom"><span className="tag-check">✓</span> Oh, now I get it!</div>
            </div>
          </div>
          <div className="container-x hero-bottom"><span>MADE FOR CURIOUS MINDS IN CLASSES 6–12</span><div><span>CBSE</span><span>ICSE</span><span>STATE BOARDS</span></div></div>
        </section>

        <section className="steps-section" id="how-it-works">
          <div className="container-x">
            <div className="section-heading"><div><span className="section-kicker">SIMPLE BY DESIGN</span><h2>From stuck to <em>got it.</em></h2></div><p>Good learning isn&apos;t about getting answers faster. It&apos;s about understanding what comes next.</p></div>
            <div className="steps-grid">{steps.map(step => <div className={`step-card ${step.color}`} key={step.number}><div className="step-top"><span>{step.number} / 03</span><span className="step-icon">{step.icon}</span></div><h3>{step.title}</h3><p>{step.description}</p></div>)}</div>
          </div>
        </section>

        <section className="difference-section" id="why">
          <div className="container-x difference-grid">
            <div className="difference-visual"><div className="visual-decoration">✳</div><div className="conversation-card"><div className="chat-label">WHEN IT DOESN&apos;T CLICK...</div><div className="chat-question">I still don&apos;t understand 🤔</div><div className="chat-response"><span className="chat-avatar">✳</span><div>No worries! Let&apos;s try a different way. Imagine sharing a pizza with your friends...<span className="typing-dots">● ● ●</span></div></div><div className="chat-options"><span>Explain simply</span><span>Show an example</span></div></div><div className="visual-caption">There&apos;s always another way to explain it. <span>↗</span></div></div>
            <div className="difference-copy"><span className="section-kicker">BUILT AROUND YOU</span><h2>Not just the answer. <em>The understanding.</em></h2><p>Everyone learns differently. When an explanation doesn&apos;t land, Learnzo finds another way in — with simpler words, real-life examples, and little steps that make a big difference.</p><ul><li><span>✓</span> Explanations at your pace</li><li><span>✓</span> Practice that builds real confidence</li><li><span>✓</span> A safe space to ask again (and again)</li></ul><Link href="/how-it-works" className="text-link">Explore how Learnzo works <span>↗</span></Link></div>
          </div>
        </section>

        <section className="subjects-section" id="subjects"><div className="container-x"><div className="section-heading"><div><span className="section-kicker">A LITTLE HELP GOES A LONG WAY</span><h2>Whatever you&apos;re learning, <em>we&apos;re here.</em></h2></div><p>For the tricky problems, the big ideas, and everything in between.</p></div><div className="subjects-grid">{subjects.map(subject => <Link href="/solve" className={`subject-card ${subject.color}`} key={subject.title}><span className="subject-icon">{subject.icon}</span><span className="subject-title">{subject.title}</span><span className="subject-detail">{subject.detail}</span><span className="subject-arrow">↗</span></Link>)}</div><p className="subjects-footnote">Designed for CBSE, ICSE &amp; State Board students in classes 6–12.</p></div></section>

        <section className="cta-section"><div className="container-x cta-inner"><div className="cta-spark">✳</div><span className="section-kicker">READY WHEN YOU ARE</span><h2>Make room for more<br /><em>“I get it!”</em> moments.</h2><p>Bring your next question. We&apos;ll figure it out together.</p><Link href="/solve" className="landing-button cta-button">Try Learnzo free <span>↗</span></Link><div className="cta-small">No credit card required. Just curiosity.</div></div></section>
      </main>
      <Footer />
    </>
  );
}
