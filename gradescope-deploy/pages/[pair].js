/**
 * pages/[pair].js
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates one static page per country pair:
 *   /india-to-germany-gpa-converter
 *   /united-states-to-united-kingdom-gpa-converter
 *   … (930 total)
 *
 * Each page:
 *   • Has unique <title> and <meta description>
 *   • Has Open Graph / Twitter card tags
 *   • Contains 800 + words of unique, data-driven content
 *   • Embeds a live mini-converter pre-set to the pair
 *   • Is fully pre-rendered (SSG) — no client-side fetch
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';
import { useState } from 'react';
import { getSupportedCountries, getSystem } from '../lib/gradingSystems';
import { convertGPA } from '../lib/calculations';

// ── Helpers ──────────────────────────────────────────────────────────────────

function slugify(name) {
  return name.toLowerCase().replace(/\s+/g, '-');
}

function titleCase(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

/** Parse "south-korea-to-united-arab-emirates-gpa-converter" → { from, to } */
function parsePair(pairSlug, countries) {
  const base = pairSlug.replace(/-gpa-converter$/, '');
  for (const from of countries) {
    const fs = slugify(from);
    if (base.startsWith(fs + '-to-')) {
      const ts = base.slice(fs.length + 4);
      const to = countries.find(c => slugify(c) === ts);
      if (to) return { from, to };
    }
  }
  return null;
}

/** Build 800 + word SEO content from grading system data */
function buildContent(fromCountry, toCountry, fromSys, toSys) {
  const fromFlag = fromSys.flag;
  const toFlag   = toSys.flag;

  // Sample conversion points: pass grade, mid-range, best grade
  const samplePoints = [
    { label: `Passing grade (${fromSys.pass})`,   val: fromSys.pass },
    { label: `Mid-range`,                          val: parseFloat(((fromSys.min + fromSys.max) / 2).toFixed(2)) },
    { label: `Excellent (${fromSys.min === fromSys.max ? fromSys.min : fromSys.direction === 'desc' ? fromSys.min : fromSys.max})`,
      val: fromSys.direction === 'desc' ? fromSys.min : fromSys.max },
  ];
  const samples = samplePoints.map(p => {
    const r = convertGPA(p.val, fromCountry, toCountry);
    return { ...p, result: r && !r.error ? r.resultRounded : '—', label_to: r?.toLabel || '' };
  });

  return {
    intro: `Converting academic grades between ${fromCountry} and ${toCountry} is one of the most common challenges facing international students, admissions officers, and academic institutions worldwide. Whether you are applying to a ${toCountry} university with ${fromCountry} qualifications, or evaluating an applicant's ${fromCountry} transcript for a ${toCountry} institution, this tool gives you a transparent, formula-driven conversion with full step-by-step methodology — not a black-box estimate.`,

    fromSection: {
      heading: `The ${fromCountry} Grading System`,
      body: `${fromFlag} ${fromCountry} uses the ${fromSys.scaleLabel} for academic assessment. ${
        fromSys.direction === 'desc'
          ? `Unusually for international scales, this system is descending — lower numbers represent better performance. The best possible grade is ${fromSys.min} and the worst is ${fromSys.max}. A student passes when their grade is at or below ${fromSys.pass}.`
          : `Grades range from ${fromSys.min} (lowest) to ${fromSys.max} (highest), with ${fromSys.pass} as the minimum passing threshold.`
      } ${fromSys.scaleNote ? `Key context: ${fromSys.scaleNote}.` : ''} The grade system is organised into ${fromSys.gradeMap.length} distinct classification bands: ${fromSys.gradeMap.map(b => b.label).join(', ')}. Understanding these bands is critical for accurate equivalency — a bare pass carries very different weight from an honours distinction, and any conversion must preserve that distinction rather than flatten it into a single linear ratio.`,
    },

    toSection: {
      heading: `The ${toCountry} Grading System`,
      body: `${toFlag} ${toCountry} uses the ${toSys.scaleLabel} for academic assessment. ${
        toSys.direction === 'desc'
          ? `Like some European systems, this scale is descending — ${toSys.min} represents the highest academic achievement and ${toSys.max} the lowest. The passing threshold is ${toSys.pass}.`
          : `On this scale, grades run from ${toSys.min} to ${toSys.max}, with ${toSys.pass} as the minimum required to pass a module or course.`
      } ${toSys.scaleNote ? `Important note: ${toSys.scaleNote}.` : ''} ${toCountry}'s ${toSys.gradeMap.length} grade bands are: ${toSys.gradeMap.map(b => b.label).join(', ')}. When receiving ${fromCountry} applicants, ${toCountry} institutions and credential evaluation services map incoming grades to these bands using the conversion method described below.`,
    },

    methodSection: {
      heading: 'Conversion Methodology',
      body: `GradeScope converts grades using a two-step normalisation pipeline rather than a simple ratio. ${
        fromSys.direction === 'desc' || toSys.direction === 'desc'
          ? `Because ${fromSys.direction === 'desc' ? fromCountry : toCountry} uses a descending scale, a modified Bavarian formula is applied. This formula — originally developed and endorsed by the German Academic Exchange Service (DAAD) — ensures that the passing threshold in the source country always maps exactly to the passing threshold in the destination country. This preserves the academic meaning of a result rather than distorting it through linear extrapolation.`
          : `Both ${fromCountry} and ${toCountry} use ascending scales, so a linear normalisation formula is applied: the source grade is first converted to an internal percentage (0–100%) that preserves the relationship between the grade, the minimum, maximum, and pass threshold. This percentage is then mapped to the destination scale using the equivalent formula in reverse.`
      } The internal percentage is also used to compute a 4.0 GPA equivalent, following the World Education Services (WES) grading framework, which is the recognised standard for international academic credential evaluation in North America and widely referenced globally.`,
    },

    samplesSection: {
      heading: 'Example Conversions',
      rows: samples,
    },

    practicalSection: {
      heading: 'Practical Guidance for Students',
      body: `If you are a student from ${fromCountry} applying to institutions in ${toCountry}, here is what you need to know. First, always obtain an official transcript from your institution — self-reported grades are not accepted for admission purposes. Second, many ${toCountry} institutions accept conversion results from recognised credential evaluation services, but some perform their own in-house evaluation. GradeScope provides the transparent methodology so you can explain or verify any conversion you receive. Third, note that the ${toSys.scaleLabel} used in ${toCountry} has a minimum passing grade of ${toSys.pass} — ensure any converted grade you present meets or exceeds this threshold. Fourth, if your institution uses a different grading convention (for example, some private universities in ${fromCountry} follow international standards that differ from the national norm), make sure to specify this when submitting your application. Finally, keep in mind that grade conversion is one component of the admissions process — language proficiency, letters of recommendation, and personal statements carry significant weight alongside academic records.`,
    },

    faqSection: [
      {
        q: `Is this conversion officially recognised?`,
        a: `GradeScope uses established academic conversion formulas including the Modified Bavarian Formula (DAAD-endorsed) and WES-aligned normalisation. However, final grade recognition is always determined by the receiving institution or official credential evaluation body. Use this tool to understand your equivalency and prepare your application — always verify with the target institution.`,
      },
      {
        q: `What is the 4.0 GPA equivalent of my ${fromCountry} grade?`,
        a: `Enter your grade in the converter above and the result will include a 4.0 GPA equivalent alongside the ${toCountry} converted grade. The 4.0 equivalent follows WES thresholds: 93%+ maps to 4.0, 90–92% to 3.7, and so on down to below 60% which maps to 0.0 (fail).`,
      },
      {
        q: `Can I convert in the other direction — ${toCountry} to ${fromCountry}?`,
        a: `Yes. GradeScope supports fully bidirectional conversion across all 31 countries. Visit the ${toCountry} to ${fromCountry} converter page or use the Grade Converter on the Tools page and select your countries.`,
      },
      {
        q: `Does GradeScope handle pass/fail differently from numerical grades?`,
        a: `Yes. Every conversion result includes an explicit pass/fail verdict based on the destination country's actual passing threshold (${toSys.pass} on the ${toSys.scaleLabel}). A numerically converted grade that falls below this threshold is flagged as failing even if it would be considered passing in the source country.`,
      },
    ],

    closingCta: `Ready to convert your ${fromCountry} grade? Use the live converter above — enter your grade, see the ${toCountry} equivalent, and get a full step-by-step breakdown of the formula. For cumulative GPA calculation across multiple subjects, visit the GPA Calculator.`,
  };
}

// ── Static generation ─────────────────────────────────────────────────────────

export async function getStaticPaths() {
  const countries = getSupportedCountries();
  const paths = [];
  for (const from of countries) {
    for (const to of countries) {
      if (from !== to) {
        paths.push({
          params: { pair: `${slugify(from)}-to-${slugify(to)}-gpa-converter` },
        });
      }
    }
  }
  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const countries = getSupportedCountries();
  const parsed = parsePair(params.pair, countries);
  if (!parsed) return { notFound: true };

  const { from: fromCountry, to: toCountry } = parsed;
  const fromSys = getSystem(fromCountry);
  const toSys   = getSystem(toCountry);

  // Pre-compute grade-map equivalency table (source → destination)
  const table = fromSys.gradeMap.map(band => {
    const mid  = parseFloat(((band.min + band.max) / 2).toFixed(4));
    const conv = convertGPA(mid, fromCountry, toCountry);
    return {
      label:    band.label,
      range:    band.min === band.max ? `${band.min}` : `${band.min}–${band.max}`,
      gpa4:     band.gpa4,
      result:   conv && !conv.error ? conv.resultRounded : '—',
      toLbl:    conv?.toLabel || '—',
      isPassing: conv?.isPassing ?? false,
    };
  });

  const content = buildContent(fromCountry, toCountry, fromSys, toSys);

  return {
    props: {
      fromCountry, toCountry,
      fromSys: JSON.parse(JSON.stringify(fromSys)), // serialise for Next.js
      toSys:   JSON.parse(JSON.stringify(toSys)),
      table,
      content,
      pair: params.pair,
    },
  };
}

// ── Page component ────────────────────────────────────────────────────────────

export default function ConverterPairPage({ fromCountry, toCountry, fromSys, toSys, table, content, pair }) {
  const [gradeInput, setGradeInput] = useState('');
  const [result,     setResult]     = useState(null);
  const [error,      setError]      = useState('');

  const pageTitle = `${fromCountry} to ${toCountry} Grade Converter — GradeScope`;
  const metaDesc  = `Convert ${fromCountry} grades to ${toCountry} equivalents. Formula-transparent conversion using the ${fromSys.scaleLabel} and ${toSys.scaleLabel}. Includes pass/fail verdict and step-by-step breakdown.`;
  const canonical = `https://www.gradescope.io/${pair}`;

  function convert() {
    setError(''); setResult(null);
    if (gradeInput === '') { setError('Please enter a grade.'); return; }
    const r = convertGPA(gradeInput, fromCountry, toCountry);
    if (!r || r.error) { setError(r?.error || 'Invalid grade.'); return; }
    setResult(r);
  }

  return (
    <Layout title={pageTitle} activePage="tools">
      <Head>
        <meta name="description" content={metaDesc} />
        <link rel="canonical" href={canonical} />

        {/* Open Graph */}
        <meta property="og:type"        content="website" />
        <meta property="og:url"         content={canonical} />
        <meta property="og:title"       content={pageTitle} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:site_name"   content="GradeScope" />

        {/* Twitter Card */}
        <meta name="twitter:card"        content="summary" />
        <meta name="twitter:title"       content={pageTitle} />
        <meta name="twitter:description" content={metaDesc} />

        {/* Structured data — WebPage + FAQPage */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": content.faqSection.map(faq => ({
            "@type": "Question",
            "name": faq.q,
            "acceptedAnswer": { "@type": "Answer", "text": faq.a },
          })),
        })}} />
      </Head>

      {/* HERO */}
      <section style={{background:'var(--ink)',padding:'3.5rem 2rem 2.5rem',textAlign:'center',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 60% 60% at 50% 100%,rgba(201,153,58,0.12),transparent)',pointerEvents:'none'}}></div>
        <p style={{fontFamily:"'DM Mono',monospace",fontSize:'0.68rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.9rem'}}>
          Grade Converter · Formula Transparent
        </p>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:'clamp(1.8rem,4.5vw,3rem)',fontWeight:900,color:'#fff',lineHeight:1.15,letterSpacing:'-0.02em',marginBottom:'1rem'}}>
          {fromSys.flag} {fromCountry} → {toSys.flag} {toCountry}
        </h1>
        <p style={{fontSize:'1rem',color:'rgba(255,255,255,0.6)',maxWidth:'560px',margin:'0 auto 2rem',lineHeight:1.7}}>
          Convert {fromSys.scaleLabel} grades to {toSys.scaleLabel} equivalents.
          Transparent formula · Pass/fail verdict · 4.0 GPA equivalent.
        </p>

        {/* Breadcrumb */}
        <nav style={{fontSize:'0.78rem',color:'rgba(255,255,255,0.35)'}}>
          <Link href="/" style={{color:'rgba(255,255,255,0.35)',textDecoration:'none'}}>Home</Link>
          {' / '}
          <Link href="/tools" style={{color:'rgba(255,255,255,0.35)',textDecoration:'none'}}>Tools</Link>
          {' / '}
          <span style={{color:'var(--gold)'}}>
            {fromCountry} to {toCountry}
          </span>
        </nav>
      </section>

      {/* MINI-CONVERTER */}
      <section style={{maxWidth:'680px',margin:'0 auto',padding:'2.5rem 1.5rem'}}>
        <div style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:'14px',overflow:'hidden',boxShadow:'0 4px 24px rgba(0,0,0,0.06)'}}>
          <div style={{background:'var(--ink)',padding:'1.1rem 1.5rem',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span style={{fontFamily:"'Playfair Display',serif",color:'#fff',fontSize:'0.95rem',fontWeight:700}}>
              {fromSys.flag} {fromCountry} → {toSys.flag} {toCountry}
            </span>
            <span style={{fontFamily:"'DM Mono',monospace",fontSize:'0.64rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gold)'}}>
              LIVE CONVERTER
            </span>
          </div>

          <div style={{padding:'1.5rem'}}>
            {/* Scale hint */}
            <div style={{display:'flex',gap:'0.75rem',marginBottom:'1.25rem',flexWrap:'wrap'}}>
              <div style={{flex:1,minWidth:'160px',background:'var(--parchment)',borderRadius:'8px',padding:'0.75rem 1rem',fontSize:'0.8rem',color:'var(--slate)'}}>
                <strong style={{display:'block',fontSize:'0.72rem',textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--slate-light)',marginBottom:'0.2rem'}}>Source</strong>
                {fromSys.flag} {fromCountry}<br />
                <span style={{color:'var(--slate-light)'}}>{fromSys.scaleLabel} · pass: {fromSys.pass}</span>
              </div>
              <div style={{flex:1,minWidth:'160px',background:'var(--parchment)',borderRadius:'8px',padding:'0.75rem 1rem',fontSize:'0.8rem',color:'var(--slate)'}}>
                <strong style={{display:'block',fontSize:'0.72rem',textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--slate-light)',marginBottom:'0.2rem'}}>Destination</strong>
                {toSys.flag} {toCountry}<br />
                <span style={{color:'var(--slate-light)'}}>{toSys.scaleLabel} · pass: {toSys.pass}</span>
              </div>
            </div>

            {/* Input */}
            <div style={{display:'flex',gap:'0.75rem',alignItems:'flex-end',marginBottom:'1rem'}}>
              <div style={{flex:1}}>
                <label style={{display:'block',fontSize:'0.75rem',fontWeight:600,color:'var(--slate)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'0.35rem'}}>
                  Your {fromCountry} Grade
                </label>
                <input
                  type="number" step="0.01"
                  value={gradeInput}
                  onChange={e => { setGradeInput(e.target.value); setResult(null); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && convert()}
                  placeholder={`e.g. ${fromSys.direction === 'desc' ? fromSys.pass : Math.round((fromSys.max * 0.75 + fromSys.min * 0.25))}`}
                  style={{width:'100%',border:'1px solid var(--border)',borderRadius:'8px',padding:'0.6rem 0.9rem',fontFamily:"'DM Sans',sans-serif",fontSize:'1rem',background:'var(--parchment)',color:'var(--ink)',boxSizing:'border-box'}}
                />
              </div>
              <button
                onClick={convert}
                style={{background:'var(--ink)',color:'var(--gold)',border:'2px solid var(--gold)',borderRadius:'8px',padding:'0.6rem 1.4rem',fontFamily:"'DM Sans',sans-serif",fontSize:'0.9rem',fontWeight:700,cursor:'pointer',whiteSpace:'nowrap',transition:'all 0.18s'}}
              >
                Convert →
              </button>
            </div>

            {error && (
              <p style={{color:'#e74c3c',fontSize:'0.82rem',marginBottom:'0.75rem',fontStyle:'italic'}}>⚠ {error}</p>
            )}

            {/* Result */}
            {result && (
              <div style={{borderTop:'1px solid var(--border)',paddingTop:'1.25rem'}}>
                <div style={{display:'flex',gap:'1rem',flexWrap:'wrap',marginBottom:'1rem'}}>
                  <div style={{textAlign:'center',flex:1,minWidth:'100px'}}>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:'2.5rem',fontWeight:900,color: result.isPassing ? '#27ae60' : '#e74c3c',lineHeight:1}}>
                      {result.resultRounded}
                    </div>
                    <div style={{fontSize:'0.72rem',color:'var(--slate-light)',textTransform:'uppercase',letterSpacing:'0.08em',marginTop:'0.3rem'}}>
                      {toSys.scaleLabel}
                    </div>
                  </div>
                  <div style={{flex:2,minWidth:'160px'}}>
                    <div style={{display:'flex',gap:'0.5rem',alignItems:'center',marginBottom:'0.5rem'}}>
                      <span style={{
                        background: result.isPassing ? 'rgba(39,174,96,0.12)' : 'rgba(231,76,60,0.12)',
                        color: result.isPassing ? '#1e8449' : '#c0392b',
                        border: `1px solid ${result.isPassing ? '#27ae60' : '#e74c3c'}`,
                        borderRadius:'4px',padding:'2px 8px',
                        fontFamily:"'DM Mono',monospace",fontSize:'0.68rem',fontWeight:700,letterSpacing:'0.1em',
                      }}>
                        {result.isPassing ? 'PASS' : 'FAIL'}
                      </span>
                      <span style={{fontSize:'0.82rem',color:'var(--slate)',fontWeight:600}}>{result.toLabel || ''}</span>
                    </div>
                    <div style={{fontSize:'0.78rem',color:'var(--slate-light)',lineHeight:1.6}}>
                      Internal %: <strong>{result.internalPercent}%</strong><br />
                      4.0 GPA equiv: <strong>{result.gpa4}</strong>
                    </div>
                  </div>
                </div>
                <div style={{background:'var(--parchment)',borderRadius:'6px',padding:'0.6rem 0.9rem',fontSize:'0.76rem',color:'var(--slate-light)'}}>
                  For full step-by-step formula breakdown →{' '}
                  <Link href={`/tools?from=${encodeURIComponent(fromCountry)}&to=${encodeURIComponent(toCountry)}`}
                    style={{color:'var(--gold)',fontWeight:600,textDecoration:'none'}}>
                    Open in Grade Converter
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Swap link */}
        <div style={{textAlign:'center',marginTop:'1rem'}}>
          <Link href={`/${slugify(toCountry)}-to-${slugify(fromCountry)}-gpa-converter`}
            style={{fontSize:'0.82rem',color:'var(--slate-light)',textDecoration:'none',display:'inline-flex',alignItems:'center',gap:'0.35rem'}}>
            ⇄ Switch to {toCountry} → {fromCountry}
          </Link>
        </div>
      </section>

      {/* CONTENT */}
      <article style={{maxWidth:'780px',margin:'0 auto',padding:'0 1.5rem 4rem'}}>

        {/* Intro */}
        <p style={{fontSize:'1.05rem',color:'var(--slate)',lineHeight:1.8,marginBottom:'2.5rem',borderLeft:'3px solid var(--gold)',paddingLeft:'1.25rem'}}>
          {content.intro}
        </p>

        {/* Grade table */}
        <div style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:'12px',overflow:'hidden',marginBottom:'2.5rem'}}>
          <div style={{background:'var(--ink)',padding:'0.9rem 1.5rem',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span style={{fontFamily:"'Playfair Display',serif",color:'#fff',fontSize:'0.95rem',fontWeight:700}}>
              Grade Equivalency Table
            </span>
            <span style={{fontFamily:"'DM Mono',monospace",fontSize:'0.64rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gold)'}}>
              {fromCountry} → {toCountry}
            </span>
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.85rem'}}>
              <thead>
                <tr style={{background:'var(--parchment)'}}>
                  <th style={{padding:'0.65rem 1.2rem',textAlign:'left',fontSize:'0.72rem',textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--slate-light)',fontWeight:600,borderBottom:'1px solid var(--border)'}}>{fromCountry} Grade</th>
                  <th style={{padding:'0.65rem 1rem',textAlign:'left',fontSize:'0.72rem',textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--slate-light)',fontWeight:600,borderBottom:'1px solid var(--border)'}}>Range</th>
                  <th style={{padding:'0.65rem 1rem',textAlign:'left',fontSize:'0.72rem',textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--slate-light)',fontWeight:600,borderBottom:'1px solid var(--border)'}}>{toCountry} Equiv.</th>
                  <th style={{padding:'0.65rem 1rem',textAlign:'left',fontSize:'0.72rem',textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--slate-light)',fontWeight:600,borderBottom:'1px solid var(--border)'}}>4.0 GPA</th>
                  <th style={{padding:'0.65rem 1rem',textAlign:'left',fontSize:'0.72rem',textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--slate-light)',fontWeight:600,borderBottom:'1px solid var(--border)'}}>Classification</th>
                </tr>
              </thead>
              <tbody>
                {table.map((row, i) => (
                  <tr key={i} style={{borderBottom:'1px solid var(--border)',background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)'}}>
                    <td style={{padding:'0.55rem 1.2rem',fontWeight:600,color:'var(--ink)'}}>{row.label}</td>
                    <td style={{padding:'0.55rem 1rem',fontFamily:"'DM Mono',monospace",color:'var(--slate)',fontSize:'0.82rem'}}>{row.range}</td>
                    <td style={{padding:'0.55rem 1rem',fontFamily:"'DM Mono',monospace",fontWeight:700,color:'var(--gold)'}}>{row.result}</td>
                    <td style={{padding:'0.55rem 1rem',fontFamily:"'DM Mono',monospace",color:'var(--slate)',fontSize:'0.82rem'}}>{row.gpa4.toFixed(1)}</td>
                    <td style={{padding:'0.55rem 1rem'}}>
                      <span style={{fontSize:'0.72rem',fontWeight:700,padding:'2px 7px',borderRadius:'4px',
                        background: row.isPassing ? 'rgba(39,174,96,0.1)' : 'rgba(231,76,60,0.1)',
                        color: row.isPassing ? '#1e8449' : '#c0392b',
                      }}>
                        {row.toLbl}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* From country section */}
        <section style={{marginBottom:'2rem'}}>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:'1.4rem',fontWeight:700,marginBottom:'0.9rem',display:'flex',alignItems:'center',gap:'0.5rem'}}>
            <span style={{width:'3px',height:'1.2em',background:'var(--gold)',borderRadius:'2px',display:'inline-block'}}></span>
            {content.fromSection.heading}
          </h2>
          <p style={{fontSize:'0.95rem',color:'var(--slate)',lineHeight:1.8}}>{content.fromSection.body}</p>
        </section>

        {/* To country section */}
        <section style={{marginBottom:'2rem'}}>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:'1.4rem',fontWeight:700,marginBottom:'0.9rem',display:'flex',alignItems:'center',gap:'0.5rem'}}>
            <span style={{width:'3px',height:'1.2em',background:'var(--gold)',borderRadius:'2px',display:'inline-block'}}></span>
            {content.toSection.heading}
          </h2>
          <p style={{fontSize:'0.95rem',color:'var(--slate)',lineHeight:1.8}}>{content.toSection.body}</p>
        </section>

        {/* Methodology */}
        <section style={{marginBottom:'2rem'}}>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:'1.4rem',fontWeight:700,marginBottom:'0.9rem',display:'flex',alignItems:'center',gap:'0.5rem'}}>
            <span style={{width:'3px',height:'1.2em',background:'var(--gold)',borderRadius:'2px',display:'inline-block'}}></span>
            {content.methodSection.heading}
          </h2>
          <p style={{fontSize:'0.95rem',color:'var(--slate)',lineHeight:1.8}}>{content.methodSection.body}</p>
        </section>

        {/* Practical guidance */}
        <section style={{background:'var(--parchment)',border:'1px solid var(--border)',borderRadius:'12px',padding:'1.75rem 2rem',marginBottom:'2rem'}}>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:'1.3rem',fontWeight:700,marginBottom:'1rem'}}>
            {content.practicalSection.heading}
          </h2>
          <p style={{fontSize:'0.93rem',color:'var(--slate)',lineHeight:1.85}}>{content.practicalSection.body}</p>
        </section>

        {/* FAQ */}
        <section style={{marginBottom:'2.5rem'}}>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:'1.4rem',fontWeight:700,marginBottom:'1.25rem',display:'flex',alignItems:'center',gap:'0.5rem'}}>
            <span style={{width:'3px',height:'1.2em',background:'var(--gold)',borderRadius:'2px',display:'inline-block'}}></span>
            Frequently Asked Questions
          </h2>
          <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
            {content.faqSection.map((faq, i) => (
              <div key={i} style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:'10px',padding:'1.25rem 1.5rem'}}>
                <h3 style={{fontSize:'0.95rem',fontWeight:700,color:'var(--ink)',marginBottom:'0.5rem'}}>{faq.q}</h3>
                <p style={{fontSize:'0.88rem',color:'var(--slate-light)',lineHeight:1.75,margin:0}}>{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Disclaimer */}
        <div style={{background:'rgba(201,153,58,0.06)',border:'1px solid rgba(201,153,58,0.25)',borderLeft:'4px solid var(--gold)',borderRadius:'0 8px 8px 0',padding:'1rem 1.25rem',marginBottom:'2rem',fontSize:'0.82rem',color:'var(--slate)',lineHeight:1.7}}>
          <strong>⚠ Academic Disclaimer:</strong>{' '}
          This conversion is provided for informational purposes only. Final grade recognition, equivalency, and admission decisions rest solely with the receiving institution. GradeScope does not represent any official academic body. Always verify results with your target institution or a certified credential evaluation service.
        </div>

        {/* CTA */}
        <div style={{background:'var(--ink)',borderRadius:'14px',padding:'2.5rem',textAlign:'center'}}>
          <p style={{fontFamily:"'DM Mono',monospace",fontSize:'0.68rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.75rem'}}>
            Need More Tools?
          </p>
          <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:'1.5rem',fontWeight:700,color:'#fff',marginBottom:'0.75rem'}}>
            Full Converter · GPA Calculator · Study Tool
          </h3>
          <p style={{fontSize:'0.88rem',color:'rgba(255,255,255,0.55)',marginBottom:'1.5rem',lineHeight:1.6}}>
            {content.closingCta}
          </p>
          <div style={{display:'flex',gap:'0.75rem',justifyContent:'center',flexWrap:'wrap'}}>
            <Link href="/tools" className="btn-primary">Open Full Converter →</Link>
            <Link href="/tools?tab=gpa" className="btn-secondary">GPA Calculator →</Link>
          </div>
        </div>

        {/* Related pairs */}
        <div style={{marginTop:'2.5rem'}}>
          <p style={{fontSize:'0.8rem',fontWeight:600,color:'var(--slate-light)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'0.75rem'}}>
            Related Conversions
          </p>
          <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
            {[toCountry, fromCountry].flatMap(country =>
              getSupportedCountries()
                .filter(c => c !== country && c !== fromCountry && c !== toCountry)
                .slice(0, 3)
                .map(other => ({ from: country, to: other }))
            ).slice(0, 6).map((rel, i) => (
              <Link key={i}
                href={`/${slugify(rel.from)}-to-${slugify(rel.to)}-gpa-converter`}
                style={{fontSize:'0.78rem',color:'var(--slate)',textDecoration:'none',border:'1px solid var(--border)',borderRadius:'5px',padding:'4px 10px',background:'var(--white)',transition:'border-color 0.15s'}}
              >
                {getSystem(rel.from).flag} {rel.from} → {getSystem(rel.to).flag} {rel.to}
              </Link>
            ))}
          </div>
        </div>

      </article>
    </Layout>
  );
}
