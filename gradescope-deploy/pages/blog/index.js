/**
 * pages/blog/index.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Static blog landing page. No CMS — all articles are defined as a static
 * array in this file. Add new articles to ARTICLES and create matching files
 * in pages/blog/[slug].js data array.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';

export const ARTICLES = [
  {
    slug: 'how-to-convert-gpa-for-german-university',
    title: 'How to Convert Your GPA for a German University Application',
    excerpt: 'Applying to Germany? Every international applicant needs to convert their home grade to the German Notensystem. Learn exactly how the Modified Bavarian Formula works, why it matters, and how to check your eligibility.',
    date: '2025-03-01',
    category: 'Country Guides',
    readTime: '8 min read',
    emoji: '🇩🇪',
  },
  {
    slug: 'understanding-us-gpa-scale',
    title: 'Understanding the US 4.0 GPA Scale: A Complete International Guide',
    excerpt: 'The US GPA scale is one of the most referenced academic metrics in the world — yet it confuses many international students. This guide explains grade points, quality points, cumulative GPA, and how the US system compares to 30 other countries.',
    date: '2025-03-08',
    category: 'Academic Systems',
    readTime: '10 min read',
    emoji: '🇺🇸',
  },
  {
    slug: 'india-cgpa-conversion-guide',
    title: 'Converting Indian CGPA for International Admissions: Everything You Need to Know',
    excerpt: "India's 10-point CGPA system is used by millions of students applying to universities in the US, UK, Germany, Canada and beyond. Here's how it converts — and why the method matters as much as the result.",
    date: '2025-03-15',
    category: 'Country Guides',
    readTime: '9 min read',
    emoji: '🇮🇳',
  },
  {
    slug: 'uk-degree-classification-explained',
    title: 'UK Degree Classification Explained: First, 2:1, 2:2, Third — and What They Mean Abroad',
    excerpt: 'The UK Honours classification system is unique among major academic nations. A First Class degree, a 2:1, a 2:2 — what do these mean when converted to GPA, German Noten, or French mentions? This guide answers all of it.',
    date: '2025-03-22',
    category: 'Academic Systems',
    readTime: '8 min read',
    emoji: '🇬🇧',
  },
  {
    slug: 'what-is-bavarian-formula',
    title: 'The Modified Bavarian Formula: Why It Is the Gold Standard for Grade Conversion',
    excerpt: 'Not all grade conversion methods are equal. The Modified Bavarian Formula — developed and endorsed by the German Academic Exchange Service (DAAD) — is widely considered the most academically rigorous approach. Here is how it works.',
    date: '2025-04-01',
    category: 'Methodology',
    readTime: '7 min read',
    emoji: '📐',
  },
  {
    slug: 'gpa-calculation-methods-by-country',
    title: 'How Different Countries Calculate GPA: A Side-by-Side Comparison',
    excerpt: 'The United States, Germany, France, India, China and the Philippines all compute academic averages differently. Some are weighted, some are cumulative, some use letter grades. This article maps out the key differences across 31 countries.',
    date: '2025-04-10',
    category: 'Academic Systems',
    readTime: '11 min read',
    emoji: '🌍',
  },
  {
    slug: 'wes-credential-evaluation-guide',
    title: 'WES Credential Evaluation: What It Is, How It Works, and How to Prepare',
    excerpt: 'World Education Services (WES) is the most widely recognised credential evaluation service in North America. If you are applying to a Canadian or US institution, understanding WES and how they evaluate your foreign grades is essential.',
    date: '2025-04-18',
    category: 'Admissions',
    readTime: '9 min read',
    emoji: '📋',
  },
];

const CATEGORIES = ['All', ...new Set(ARTICLES.map(a => a.category))];

export default function BlogIndex() {
  return (
    <Layout title="Blog & Articles — GradeScope" activePage="blog">
      <Head>
        <meta name="description" content="Practical articles on international grade conversion, GPA calculation, academic systems and study abroad. Written for students navigating international education." />
        <link rel="canonical" href="https://www.gradescope.io/blog" />
        <meta property="og:title" content="Blog & Articles — GradeScope" />
        <meta property="og:description" content="Practical guides on GPA conversion, the Bavarian formula, international academic systems and study abroad preparation." />
        <meta property="og:type" content="website" />
      </Head>

      {/* HERO */}
      <section style={{background:'var(--ink)',padding:'3.5rem 2rem 2.5rem',textAlign:'center',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 60% 60% at 50% 100%,rgba(201,153,58,0.12),transparent)',pointerEvents:'none'}}></div>
        <p style={{fontFamily:"'DM Mono',monospace",fontSize:'0.68rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.9rem'}}>
          GradeScope · Blog & Articles
        </p>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:'clamp(1.8rem,4.5vw,3rem)',fontWeight:900,color:'#fff',lineHeight:1.15,letterSpacing:'-0.02em',marginBottom:'1rem'}}>
          International Academic Guides
        </h1>
        <p style={{fontSize:'1rem',color:'rgba(255,255,255,0.6)',maxWidth:'520px',margin:'0 auto',lineHeight:1.7}}>
          Practical articles on grade conversion, GPA calculation, and academic systems — written for students navigating international education.
        </p>
      </section>

      {/* ARTICLE GRID */}
      <section style={{maxWidth:'1100px',margin:'0 auto',padding:'3rem 1.5rem 5rem'}}>

        {/* Category pills */}
        <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap',marginBottom:'2.5rem'}}>
          {CATEGORIES.map(cat => (
            <span key={cat} style={{
              padding:'0.35rem 1rem',borderRadius:'20px',fontSize:'0.8rem',fontWeight:600,
              background: cat === 'All' ? 'var(--ink)' : 'var(--white)',
              color: cat === 'All' ? 'var(--gold)' : 'var(--slate)',
              border: `1px solid ${cat === 'All' ? 'var(--gold)' : 'var(--border)'}`,
            }}>
              {cat}
            </span>
          ))}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:'1.5rem'}}>
          {ARTICLES.map(article => (
            <Link key={article.slug} href={`/blog/${article.slug}`} style={{textDecoration:'none',display:'block'}}>
              <article style={{
                background:'var(--white)',border:'1px solid var(--border)',borderRadius:'14px',
                overflow:'hidden',height:'100%',transition:'box-shadow 0.2s, transform 0.2s',
                display:'flex',flexDirection:'column',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow='0 8px 32px rgba(0,0,0,0.10)'; e.currentTarget.style.transform='translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow='none'; e.currentTarget.style.transform='none'; }}
              >
                {/* Card header */}
                <div style={{background:'var(--ink)',padding:'1.5rem',display:'flex',alignItems:'center',gap:'0.75rem'}}>
                  <span style={{fontSize:'2rem'}}>{article.emoji}</span>
                  <span style={{
                    fontFamily:"'DM Mono',monospace",fontSize:'0.64rem',letterSpacing:'0.12em',
                    textTransform:'uppercase',color:'var(--gold)',
                    background:'rgba(201,153,58,0.15)',borderRadius:'4px',padding:'2px 7px',
                  }}>
                    {article.category}
                  </span>
                </div>

                {/* Card body */}
                <div style={{padding:'1.5rem',flex:1,display:'flex',flexDirection:'column'}}>
                  <h2 style={{
                    fontFamily:"'Playfair Display',serif",fontSize:'1.05rem',fontWeight:700,
                    color:'var(--ink)',lineHeight:1.4,marginBottom:'0.75rem',
                  }}>
                    {article.title}
                  </h2>
                  <p style={{fontSize:'0.85rem',color:'var(--slate-light)',lineHeight:1.7,flex:1,marginBottom:'1.25rem'}}>
                    {article.excerpt}
                  </p>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',borderTop:'1px solid var(--border)',paddingTop:'0.9rem'}}>
                    <span style={{fontSize:'0.75rem',color:'var(--slate-light)',fontFamily:"'DM Mono',monospace"}}>
                      {new Date(article.date).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                      {' · '}{article.readTime}
                    </span>
                    <span style={{fontSize:'0.8rem',color:'var(--gold)',fontWeight:600}}>Read →</span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div style={{marginTop:'3.5rem',background:'var(--ink)',borderRadius:'14px',padding:'2.5rem',textAlign:'center'}}>
          <p style={{fontFamily:"'DM Mono',monospace",fontSize:'0.68rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.75rem'}}>
            Ready to Convert?
          </p>
          <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:'1.5rem',fontWeight:700,color:'#fff',marginBottom:'0.75rem'}}>
            Put the Knowledge to Work
          </h3>
          <p style={{fontSize:'0.88rem',color:'rgba(255,255,255,0.55)',marginBottom:'1.5rem'}}>
            Use our live grade converter and GPA calculator — formula transparent, always free.
          </p>
          <div style={{display:'flex',gap:'0.75rem',justifyContent:'center',flexWrap:'wrap'}}>
            <Link href="/tools" className="btn-primary">Grade Converter →</Link>
            <Link href="/tools?tab=gpa" className="btn-secondary">GPA Calculator →</Link>
          </div>
        </div>

      </section>
    </Layout>
  );
}
