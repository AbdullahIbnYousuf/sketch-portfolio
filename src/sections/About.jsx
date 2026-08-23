import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const highlightCards = [
  {
    title: "Full-Stack Product Development",
    desc: "Building complete web products from frontend experience through backend APIs, authentication, data models, deployment, and production workflows."
  },
  {
    title: "Backend & API Systems",
    desc: "Designing APIs, database-backed workflows, authentication, business logic, real-time communication, and backend services."
  },
  {
    title: "AI-Powered Applications",
    desc: "Integrating LLMs, embeddings, retrieval workflows, AI APIs, ML models, and human-reviewed AI features into practical products."
  },
  {
    title: "Automation & Rapid Prototyping",
    desc: "Turning ideas and business requirements into working prototypes and production-oriented systems quickly."
  },
  {
    title: "Practical Problem Solving",
    desc: "Understanding how people actually handle a problem and building the missing piece around their real workflow."
  },
  {
    title: "Ownership",
    desc: "Taking responsibility from the initial idea and technical plan through implementation, deployment, and delivery."
  }
];

const stats = [
  { value: "5", label: "Featured Projects" },
  { value: "3", label: "National Recognitions" },
  { value: "2nd", label: "Year CSE Student" },
  { value: "Open", label: "Internships & Collaboration" },
  { value: "2028", label: "Expected Graduation" }
];

export default function About() {
  const sectionRef = useRef(null);
  const leftColRef = useRef(null);
  const cardsRef = useRef([]);
  const statsRef = useRef([]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Fade in left column on scroll
    gsap.fromTo(leftColRef.current,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: leftColRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      }
    );

    // Fade in highlight cards sequentially
    gsap.fromTo(cardsRef.current,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
          toggleActions: 'play none none none'
        }
      }
    );

    // Fade in stats counter cards
    gsap.fromTo(statsRef.current,
      { opacity: 0, scale: 0.95 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        stagger: 0.06,
        ease: 'back.out(1.4)',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 50%',
          toggleActions: 'play none none none'
        }
      }
    );
  }, []);

  return (
    <section
      id="about"
      ref={sectionRef}
      style={{
        backgroundColor: 'var(--background-secondary)',
        borderTop: '1px solid var(--border-primary)',
        borderBottom: '1px solid var(--border-primary)',
        position: 'relative'
      }}
    >
      <div className="container">
        {/* Main Grid: Biography & Highlight Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '60px',
            marginBottom: '70px'
          }}
          className="about-grid"
        >
          {/* Left Column - Biography & Mission */}
          <div
            ref={leftColRef}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              textAlign: 'left'
            }}
          >
            {/* 1. Small section label */}
            <p
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--accent-primary)',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                marginBottom: '16px'
              }}
            >
              ABOUT ABDULLAH // SOFTWARE & AI DEVELOPER
            </p>

            {/* 2. Large heading */}
            <h2
              style={{
                fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
                lineHeight: 1.12,
                fontWeight: 500,
                marginBottom: '28px'
              }}
            >
              Building Practical Software.<br />
              <span className="text-gradient-purple">Turning Real Problems into Usable Products.</span>
            </h2>

            {/* 3. Premium Paragraphs */}
            <p
              style={{
                fontSize: '1.1rem',
                lineHeight: 1.7,
                color: 'var(--text-secondary)',
                marginBottom: '20px',
                fontWeight: 300
              }}
            >
              I am Abdullah Ibn Yousuf, a second-year Computer Science and Engineering student at Islamic University of Technology. I focus on practical software development, backend systems, and AI-assisted applications.
            </p>
            <p
              style={{
                fontSize: '1.1rem',
                lineHeight: 1.7,
                color: 'var(--text-secondary)',
                marginBottom: '20px',
                fontWeight: 300
              }}
            >
              I enjoy taking a real problem, understanding how people actually deal with it, and turning it into a working product—whether that is a household application used every day, a client business system, or a hackathon prototype.
            </p>
            <p
              style={{
                fontSize: '1.1rem',
                lineHeight: 1.7,
                color: 'var(--text-secondary)',
                marginBottom: '36px',
                fontWeight: 300
              }}
            >
              I am currently a Machine Learning Intern at FlyRank AI and the founder of MayX Labs, where I work on software, automation, AI-assisted systems, and client projects.
            </p>

            {/* 4. Personal Mission Statement */}
            <div
              className="glass-panel"
              style={{
                padding: '24px 28px',
                borderLeft: '4px solid var(--accent-primary)',
                backgroundColor: 'rgba(16, 16, 16, 0.6)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <span
                style={{
                  fontSize: '0.78rem',
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--accent-secondary)',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: '8px'
                }}
              >
                MISSION STATEMENT
              </span>
              <p
                style={{
                  fontSize: '1.05rem',
                  lineHeight: 1.65,
                  color: 'var(--text-primary)',
                  fontStyle: 'italic',
                  margin: 0,
                  fontWeight: 400
                }}
              >
                "I want to keep building increasingly useful products, grow into larger technical and product responsibilities, and eventually create useful work and opportunities for other people."
              </p>
            </div>
          </div>

          {/* Right Column - 5. Highlight Cards (6) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.1rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                margin: 0,
                textAlign: 'left',
                borderBottom: '1px solid var(--border-primary)',
                paddingBottom: '12px'
              }}
            >
              Core Capabilities & Focus
            </h3>
            
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '20px',
              }}
            >
              {highlightCards.map((card, idx) => (
                <div
                  key={card.title}
                  ref={el => cardsRef.current[idx] = el}
                  className="glass-panel capability-card"
                  style={{
                    padding: '24px',
                    textAlign: 'left',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <h4
                      style={{
                        fontSize: '1.15rem',
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        marginBottom: '8px'
                      }}
                    >
                      {card.title}
                    </h4>
                    <p
                      style={{
                        fontSize: '0.9rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.55,
                        margin: 0,
                        fontWeight: 300
                      }}
                    >
                      {card.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 6. Statistics Section */}
        <div
          style={{
            borderTop: '1px solid var(--border-primary)',
            borderBottom: '1px solid var(--border-primary)',
            padding: '40px 0',
            marginBottom: '50px'
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
              gap: '24px',
              textAlign: 'center'
            }}
          >
            {stats.map((stat, idx) => (
              <div
                key={stat.label}
                ref={el => statsRef.current[idx] = el}
                className="glass-panel"
                style={{
                  padding: '20px 16px',
                  backgroundColor: 'rgba(16, 16, 16, 0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <span
                  style={{
                    fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)',
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    color: 'var(--accent-primary)',
                    letterSpacing: '-0.5px'
                  }}
                >
                  {stat.value}
                </span>
                <span
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 7. Skills Summary & 8. Closing Statement */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '16px',
            maxWidth: '800px',
            margin: '0 auto'
          }}
        >
          {/* Skills Summary Tag */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px' }}>
            {['TypeScript', 'Python', 'React', 'Next.js', 'FastAPI', 'Node.js', 'PostgreSQL', 'REST APIs', 'AI API Integration', 'RAG Workflows', 'Git & GitHub'].map(skill => (
              <span
                key={skill}
                style={{
                  fontSize: '0.82rem',
                  padding: '6px 14px',
                  backgroundColor: 'rgba(0, 217, 255, 0.08)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-full)',
                  color: 'var(--accent-secondary)',
                  fontWeight: 500
                }}
              >
                {skill}
              </span>
            ))}
          </div>

          {/* Closing Statement */}
          <p
            style={{
              fontSize: '1.25rem',
              fontFamily: 'var(--font-heading)',
              color: 'var(--text-primary)',
              fontWeight: 500,
              marginTop: '10px',
              letterSpacing: '0.5px'
            }}
          >
            "I don't just build for the web — I shape how digital interactions feel."
          </p>
        </div>
      </div>

      <style>{`
        @media (min-width: 992px) {
          .about-grid {
            grid-template-columns: 0.95fr 1.05fr !important;
          }
        }
        .capability-card {
          border-left: 3px solid var(--border-primary) !important;
        }
        .capability-card:hover {
          border-left-color: var(--accent-primary) !important;
          transform: translateY(-2px);
        }
      `}</style>
    </section>
  );
}
