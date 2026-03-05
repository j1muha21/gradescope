import Layout from '../components/Layout';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';

// ── Phase 2: import pure logic from /lib ──────────────────────
import { GRADING_SYSTEMS, getSupportedCountries, getSystem } from '../lib/gradingSystems.js';
import { convertGPA, calculateGPA, normalizeToPercent } from '../lib/calculations.js';

// ── Phase 3: structured translations ──────────────────────────
import { useLang } from '../lib/LangContext';

// ─────────────────────────────────────────────────────────────
// COUNTRIES — built from lib so flags/names stay in sync
// ─────────────────────────────────────────────────────────────
const COUNTRY_LIST = getSupportedCountries().map(name => ({
  name,
  flag: getSystem(name).flag,
}));

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function gradeColor(gpa4) {
  if (gpa4 >= 3.7) return '#27ae60';
  if (gpa4 >= 3.0) return '#2980b9';
  if (gpa4 >= 2.0) return '#f39c12';
  if (gpa4 >= 1.0) return '#e67e22';
  return '#e74c3c';
}

/** Midpoint of a gradeMap band — used as the numeric grade value */
function bandMid(band) {
  return parseFloat(((band.min + band.max) / 2).toFixed(4));
}

/** Build formula explanation string for the converter */
function buildSteps(result) {
  const { fromSystem, toSystem, input, internalPercent, result: out } = result;
  const steps = [];

  // Step 1: normalize source
  if (fromSystem.direction === 'desc') {
    steps.push(`Step 1 — Normalize "${fromSystem.scaleLabel}" to internal %:`);
    steps.push(`  Using Modified Bavarian Formula:`);
    steps.push(`  best=${fromSystem.min}, pass=${fromSystem.pass}, worst=${fromSystem.max}`);
    if (input <= fromSystem.pass) {
      steps.push(`  ${input} ≤ pass → pct = 40 + ((${fromSystem.pass} − ${input}) / (${fromSystem.pass} − ${fromSystem.min})) × 60 = ${internalPercent}%`);
    } else {
      steps.push(`  ${input} > pass → pct = ((${fromSystem.max} − ${input}) / (${fromSystem.max} − ${fromSystem.pass})) × 40 = ${internalPercent}%`);
    }
  } else if (fromSystem.scaleType === 'italyScale') {
    steps.push(`Step 1 — Normalize Italian 18–30 scale:`);
    steps.push(`  pct = 40 + ((${input} − 18) / (30 − 18)) × 60 = ${internalPercent}%`);
  } else if (fromSystem.scaleType === 'nlScale') {
    steps.push(`Step 1 — Normalize Dutch 1–10 scale (pass=5.5):`);
    steps.push(`  pct = ${internalPercent}%`);
  } else {
    steps.push(`Step 1 — Normalize "${fromSystem.scaleLabel}" to internal %:`);
    steps.push(`  pct = (${input} − ${fromSystem.min}) / (${fromSystem.max} − ${fromSystem.min}) × 100 = ${internalPercent}%`);
  }

  // Step 2: convert to destination
  if (toSystem.direction === 'desc') {
    steps.push(`Step 2 — Convert ${internalPercent}% to "${toSystem.scaleLabel}":`);
    steps.push(`  Using reversed Bavarian formula → ${out}`);
  } else if (toSystem.scaleType === 'italyScale') {
    steps.push(`Step 2 — Convert ${internalPercent}% to Italian 18–30:`);
    steps.push(`  result = 18 + ((${internalPercent} − 40) / 60) × 12 = ${out}`);
  } else {
    steps.push(`Step 2 — Convert ${internalPercent}% to "${toSystem.scaleLabel}":`);
    steps.push(`  result = ${toSystem.min} + (${internalPercent} / 100) × (${toSystem.max} − ${toSystem.min}) = ${out}`);
  }

  return steps;
}

// ─────────────────────────────────────────────────────────────
// GRADE CONVERTER — pure React, powered by lib/calculations.js
// ─────────────────────────────────────────────────────────────
function GradeConverter() {
  const { t } = useLang();
  const [src,       setSrc]       = useState('United States');
  const [dst,       setDst]       = useState('Germany');
  const [gradeVal,  setGradeVal]  = useState('');
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState('');

  const srcSystem = getSystem(src);
  const dstSystem = getSystem(dst);

  function swap() {
    setSrc(dst); setDst(src);
    setResult(null); setError('');
  }

  function convert() {
    setError(''); setResult(null);
    if (gradeVal === '') { setError('Please enter a grade value.'); return; }
    const res = convertGPA(gradeVal, src, dst);
    if (!res || res.error) { setError(res?.error || 'Conversion failed.'); return; }
    setResult(res);
  }

  const steps = result ? buildSteps(result) : [];

  return (
    <div className="tool-wrap">
      <div className="tool-header">
        <p className="section-label">{t('tool.label')}</p>
        <h2 className="section-title">{t('tool.title')}</h2>
        <p className="section-desc">{t('tool.desc')}</p>
      </div>

      <div className="converter-card fade-in">
        <div className="converter-top">
          <h2>{t('tool.cardTitle')}</h2>
          <span className="converter-badge">{t('tool.badge')}</span>
        </div>

        <div className="converter-body">
          {/* Country row */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('tool.sourceCountry')}</label>
              <select className="form-select" value={src}
                onChange={e => { setSrc(e.target.value); setResult(null); setError(''); }}>
                {COUNTRY_LIST.map(c => (
                  <option key={c.name} value={c.name}>{c.flag} {c.name}</option>
                ))}
              </select>
            </div>

            <button className="swap-btn" onClick={swap} title="Swap countries">⇄</button>

            <div className="form-group">
              <label className="form-label">{t('tool.destCountry')}</label>
              <select className="form-select" value={dst}
                onChange={e => { setDst(e.target.value); setResult(null); setError(''); }}>
                {COUNTRY_LIST.map(c => (
                  <option key={c.name} value={c.name}>{c.flag} {c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Grade row */}
          <div className="grade-row">
            <div className="form-group">
              <label className="form-label">{t('tool.yourGrade')}</label>
              <input type="number" className="form-input" placeholder="e.g. 85"
                step="0.01" value={gradeVal}
                onChange={e => { setGradeVal(e.target.value); setResult(null); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && convert()}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('tool.gradeHint')}</label>
              <input type="text" className="form-input" readOnly
                value={srcSystem ? `${srcSystem.scaleLabel} · Pass: ${srcSystem.pass}` : ''} />
            </div>
          </div>

          {error && (
            <p style={{color:'var(--rust)',fontSize:'0.85rem',margin:'0 0 0.75rem',fontStyle:'italic'}}>
              ⚠ {error}
            </p>
          )}

          <button className="convert-btn" onClick={convert}>{t('tool.convertBtn')}</button>

          {/* Result area */}
          {result && (
            <div className="result-area">
              {/* Main result */}
              <div className="result-main">
                <div className="result-grade-box">
                  <div className="result-label-sm">{t('tool.convertedGrade')}</div>
                  <div className="result-value" style={{color: gradeColor(result.gpa4)}}>
                    {result.resultRounded}
                  </div>
                  <div className="result-scale">{dstSystem.scaleLabel}</div>
                </div>
                <div className="result-info">
                  <h3>{t('tool.conversionResult')}</h3>
                  <p>
                    <strong>{src}:</strong> {result.fromLabel || result.input}<br />
                    <strong>{dst}:</strong> {result.toLabel || result.resultRounded}
                  </p>
                </div>
              </div>

              {/* Pass / Fail verdict */}
              <div className={`verdict-panel ${result.isPassing ? 'pass-verdict' : 'fail-verdict'}`}>
                <span className="verdict-badge">{result.isPassing ? t('verdict.pass') : t('verdict.fail')}</span>
                <div className="verdict-details">
                  <div className="verdict-classification">
                    {result.toLabel || '—'}
                  </div>
                  <div className="verdict-explanation">
                    {result.isPassing
                      ? t('tool.passMsg', { pass: dstSystem.pass, scale: dstSystem.scaleLabel })
                      : t('tool.failMsg', { pass: dstSystem.pass, scale: dstSystem.scaleLabel })}
                  </div>
                </div>
              </div>

              {/* Formula transparency */}
              <div className="formula-block">
                <h4>{t('tool.formulaUsed')}</h4>
                <div className="formula-eq">
                  {srcSystem.direction === 'desc'
                    ? 'Modified Bavarian Formula → Internal % → Destination Scale'
                    : 'Linear Normalisation → Internal % → Destination Scale'}
                </div>
                <ul className="formula-vars">
                  <li><strong>{t('tool.internalPct')}</strong> {result.internalPercent}%</li>
                  <li><strong>{t('tool.gpa4equiv')}</strong> {result.gpa4}</li>
                  <li><strong>{t('tool.sourceScale')}</strong> {srcSystem.scaleLabel} (pass: {srcSystem.pass})</li>
                  <li><strong>{t('tool.destScale')}</strong> {dstSystem.scaleLabel} (pass: {dstSystem.pass})</li>
                </ul>
              </div>

              {/* Step-by-step */}
              <div className="steps-block">
                <h4>{t('tool.stepByStep')}</h4>
                {steps.map((s, i) => (
                  <div key={i} style={{
                    fontFamily: s.startsWith('Step') ? "'DM Sans',sans-serif" : "'DM Mono',monospace",
                    fontWeight: s.startsWith('Step') ? 600 : 400,
                    fontSize: s.startsWith('Step') ? '0.88rem' : '0.78rem',
                    color: s.startsWith('Step') ? 'var(--ink)' : 'var(--slate)',
                    marginBottom: '0.2rem',
                    paddingLeft: s.startsWith(' ') ? '1rem' : 0,
                  }}>{s}</div>
                ))}
              </div>

              {/* Scale comparison table */}
              <table className="scale-table">
                <thead><tr>
                  <th>{t('tool.th.gradeLevel')}</th>
                  <th>{src} Scale</th>
                  <th>{dst} Scale</th>
                  <th>{t('tool.th.classification')}</th>
                </tr></thead>
                <tbody>
                  {srcSystem.gradeMap.map((band, i) => {
                    const mid = bandMid(band);
                    const conv = convertGPA(mid, src, dst);
                    const isCurrentRow = result.fromLabel === band.label;
                    return (
                      <tr key={i} style={isCurrentRow ? {background:'rgba(212,168,58,0.1)',fontWeight:600} : {}}>
                        <td>{band.label}</td>
                        <td style={{fontFamily:"'DM Mono',monospace"}}>
                          {band.min === band.max ? band.min : `${band.min}–${band.max}`}
                        </td>
                        <td style={{fontFamily:"'DM Mono',monospace",color:'var(--gold)'}}>
                          {conv && !conv.error ? conv.resultRounded : '—'}
                        </td>
                        <td>{conv?.toLabel || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="disclaimer">
                <strong>⚠ Academic Disclaimer:</strong>{' '}
                This conversion is provided for informational purposes only. Final grade
                recognition and admission decisions rest solely with the receiving institution.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// GPA CALCULATOR — country-aware, powered by lib/calculations.js
// ─────────────────────────────────────────────────────────────
let _cid = 0;

function GpaCalculator() {
  const { t } = useLang();
  const [country,  setCountry]  = useState('United States');
  const [courses,  setCourses]  = useState(() => makeDefaultCourses('United States'));
  const [prevGpa,  setPrevGpa]  = useState('');
  const [prevCred, setPrevCred] = useState('');
  const [result,   setResult]   = useState(null);
  const [errors,   setErrors]   = useState({});

  const system = getSystem(country);
  const bands  = system.gradeMap;

  // Default grade = middle of the gradeMap
  function defaultBand(sys) {
    return sys.gradeMap[Math.floor(sys.gradeMap.length * 0.35)];
  }

  function makeDefaultCourses(cName) {
    const sys = getSystem(cName);
    const band = defaultBand(sys);
    const defaults = ['Mathematics', 'English', 'Science', 'History', 'Elective'];
    return defaults.map(name => ({
      id: ++_cid, name, credits: '3', grade: bandMid(band),
    }));
  }

  function changeCountry(c) {
    const sys = getSystem(c);
    const band = defaultBand(sys);
    const fallback = bandMid(band);
    // Snap existing grades: keep proportional position in new scale
    setCourses(prev => prev.map(row => ({ ...row, grade: fallback })));
    setCountry(c);
    setResult(null);
    setErrors({});
  }

  function addCourse() {
    const band = defaultBand(system);
    setCourses(prev => [...prev, { id: ++_cid, name: '', credits: '3', grade: bandMid(band) }]);
    setResult(null);
  }

  function removeCourse(id) {
    setCourses(prev => {
      const next = prev.filter(c => c.id !== id);
      if (next.length === 0) {
        const band = defaultBand(system);
        return [{ id: ++_cid, name: '', credits: '3', grade: bandMid(band) }];
      }
      return next;
    });
    setResult(null);
    setErrors(prev => { const e = { ...prev }; delete e[id]; return e; });
  }

  function updateCourse(id, field, val) {
    setCourses(prev => prev.map(c => c.id === id ? { ...c, [field]: val } : c));
    if (field === 'credits') setErrors(prev => { const e = { ...prev }; delete e[id]; return e; });
    setResult(null);
  }

  function clearAll() {
    _cid = 0;
    setCourses(makeDefaultCourses(country));
    setPrevGpa(''); setPrevCred('');
    setResult(null); setErrors({});
  }

  function calculate() {
    // Validate credits first
    const newErrors = {};
    for (const c of courses) {
      const cr = parseFloat(c.credits);
      if (isNaN(cr) || cr <= 0) newErrors[c.id] = true;
    }
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }
    setErrors({});

    // Build subjects array for calculateGPA
    const subjects = courses.map(c => ({
      name: c.name || undefined,
      grade: parseFloat(c.grade),
      credits: parseFloat(c.credits),
    }));

    const res = calculateGPA(subjects, country);
    if (res.error) { setErrors({ _global: res.error }); return; }

    // Cumulative GPA
    let cumulative = null;
    const pg = parseFloat(prevGpa), pc = parseFloat(prevCred);
    if (!isNaN(pg) && !isNaN(pc) && pc > 0) {
      // Weighted cumulative on 4.0 scale
      const cumGpa4 = (pg * pc + res.gpa4 * res.totalCredits) / (pc + res.totalCredits);
      const cumPct  = (cumGpa4 / 4.0) * 100;
      // Convert back to native scale using the lib
      const cumNative = parseFloat(((system.max - system.min) * (cumPct / 100) + system.min).toFixed(2));
      cumulative = {
        gpa4:    parseFloat(cumGpa4.toFixed(3)),
        native:  cumNative,
        totalCr: parseFloat((pc + res.totalCredits).toFixed(1)),
        prevGpa: pg, prevCr: pc,
      };
    }

    const barPct = Math.min(100, (res.gpa4 / 4.0) * 100);
    setResult({ ...res, barPct, cumulative });
  }

  // Color based on 4.0 proportion
  const resultColor = result ? gradeColor(result.gpa4) : 'var(--gold)';

  return (
    <div className="gpa-wrap">
      <div className="tool-header">
        <p className="section-label">{t('gpa.label')}</p>
        <h2 className="section-title">{t('gpa.title')}</h2>
        <p className="section-desc">{t('gpa.desc')}</p>
      </div>

      <div className="gpa-layout">
        {/* ── Left: entry ── */}
        <div>
          <div className="gpa-card fade-in">
            <div className="gpa-card-top">
              <h2>{t('gpa.courseEntry')}</h2>
              {/* Country selector replaces the old scale switcher */}
              <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                <label style={{fontSize:'0.75rem',fontWeight:600,color:'var(--slate-light)',textTransform:'uppercase',letterSpacing:'0.05em',whiteSpace:'nowrap'}}>
                  {t('gpa.country')}
                </label>
                <select
                  className="form-select"
                  style={{fontSize:'0.82rem',padding:'0.3rem 0.6rem',width:'auto',minWidth:'160px'}}
                  value={country}
                  onChange={e => changeCountry(e.target.value)}
                >
                  {COUNTRY_LIST.map(c => (
                    <option key={c.name} value={c.name}>{c.flag} {c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Scale note */}
            <div style={{padding:'0 1.5rem 0.75rem',fontSize:'0.78rem',color:'var(--slate-light)',fontStyle:'italic'}}>
              {system.scaleNote}
            </div>

            <div className="gpa-body">
              <div className="courses-header">
                <span>{t('gpa.courseName')}</span>
                <span>{t('gpa.credits')}</span>
                <span>{t('gpa.grade')}</span>
                <span></span>
              </div>

              {courses.map(c => (
                <div key={c.id} className="course-row">
                  <input type="text" className="course-input"
                    placeholder={t('gpa.coursePlaceholder')}
                    value={c.name}
                    onChange={e => updateCourse(c.id, 'name', e.target.value)}
                  />
                  <input type="number" className={`course-input${errors[c.id] ? ' input-error' : ''}`}
                    placeholder="Cr" value={c.credits}
                    min="0.5" max="60" step="0.5"
                    onChange={e => updateCourse(c.id, 'credits', e.target.value)}
                  />
                  <select
                    className={`course-grade-select grade-${
                      // colour by rough quality tier
                      (() => {
                        const pct = normalizeToPercent(parseFloat(c.grade), country) || 0;
                        if (pct >= 80) return 'a';
                        if (pct >= 67) return 'b';
                        if (pct >= 53) return 'c';
                        if (pct >= 40) return 'd';
                        return 'f';
                      })()
                    }`}
                    value={c.grade}
                    onChange={e => updateCourse(c.id, 'grade', parseFloat(e.target.value))}
                  >
                    {bands.map((band, i) => (
                      <option key={i} value={bandMid(band)}>
                        {band.label}
                      </option>
                    ))}
                  </select>
                  <button className="remove-btn" onClick={() => removeCourse(c.id)} title="Remove">×</button>
                </div>
              ))}

              {(Object.keys(errors).length > 0 || errors._global) && (
                <p style={{color:'var(--rust)',fontSize:'0.8rem',margin:'0.25rem 0 0.5rem',fontStyle:'italic'}}>
                  ⚠ {errors._global || t('gpa.creditError')}
                </p>
              )}

              <div className="gpa-actions">
                <button className="add-course-btn" onClick={addCourse}>{t('gpa.addCourse')}</button>
                <button className="calc-gpa-btn" onClick={calculate}>{t('gpa.calcBtn')}</button>
                <button className="clear-btn" onClick={clearAll}>{t('gpa.clearAll')}</button>
              </div>
            </div>
          </div>

          {/* Cumulative */}
          <div className="cumulative-section">
            <h3>{t('gpa.cumulativeTitle')}</h3>
            <p style={{fontSize:'0.85rem',color:'var(--slate-light)',marginBottom:'1rem'}}>
              {t('gpa.cumulativeDesc')}
            </p>
            <div className="cumulative-inputs">
              <div className="form-group">
                <label className="form-label">{t('gpa.prevGPA')}</label>
                <input type="number" className="form-input" placeholder="e.g. 3.45"
                  step="0.01" min="0" max="4"
                  value={prevGpa} onChange={e => setPrevGpa(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">{t('gpa.prevCredits')}</label>
                <input type="number" className="form-input" placeholder="e.g. 60"
                  step="1" min="0"
                  value={prevCred} onChange={e => setPrevCred(e.target.value)} />
              </div>
              <button className="calc-gpa-btn" style={{height:'44px',whiteSpace:'nowrap'}} onClick={calculate}>
                {t('gpa.recalc')}
              </button>
            </div>

            {result?.cumulative && (
              <div className="cumulative-result-box">
                <div style={{textAlign:'center'}}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:'2.5rem',fontWeight:900,color:gradeColor(result.cumulative.gpa4),lineHeight:1}}>
                    {result.cumulative.gpa4.toFixed(3)}
                  </div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.68rem',letterSpacing:'.12em',textTransform:'uppercase',color:'var(--slate-light)',marginTop:'0.3rem'}}>
                    {t('gpa.cumGpaLabel')}
                  </div>
                </div>
                <div style={{flex:1,minWidth:'180px'}}>
                  <div style={{fontSize:'0.82rem',color:'var(--slate-light)',lineHeight:1.65}}>
                    {t('gpa.cumPrevLine', { gpa: result.cumulative.prevGpa.toFixed(3), cr: result.cumulative.prevCr })}<br/>
                    {t('gpa.cumNewLine',  { gpa: result.gpa4.toFixed(3), cr: result.totalCredits })}<br/>
                    {t('gpa.cumTotalLine', { cr: result.cumulative.totalCr })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Grade reference table */}
          <div style={{marginTop:'1.5rem',background:'var(--white)',border:'1px solid var(--border)',borderRadius:'10px',overflow:'hidden'}}>
            <div style={{background:'var(--ink)',padding:'1rem 1.5rem',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span style={{fontFamily:"'Playfair Display',serif",color:'var(--white)',fontSize:'1rem',fontWeight:700}}>
                {t('gpa.scaleRef')}
              </span>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:'0.72rem',letterSpacing:'.12em',textTransform:'uppercase',color:'var(--gold)'}}>
                {system.scaleLabel}
              </span>
            </div>
            <table className="scale-table">
              <thead><tr>
                <th>{t('gpa.th.letter')}</th>
                <th>{t('gpa.th.range')}</th>
                <th>{t('gpa.th.points')}</th>
                <th>{t('gpa.th.class')}</th>
              </tr></thead>
              <tbody>
                {bands.map((b, i) => (
                  <tr key={i}>
                    <td><strong>{b.label}</strong></td>
                    <td style={{fontFamily:"'DM Mono',monospace"}}>
                      {b.min === b.max ? b.min : `${b.min}–${b.max}`}
                    </td>
                    <td style={{fontFamily:"'DM Mono',monospace",color:'var(--gold)',fontWeight:600}}>
                      {b.gpa4.toFixed(1)}
                    </td>
                    <td>{b.label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Right: results ── */}
        <div>
          <div className="gpa-result-panel">
            <div className="gpa-result-top"><h3>{t('gpa.resultTitle')}</h3></div>
            <div className="gpa-result-body">
              {!result ? (
                <div className="gpa-empty-state">
                  <div className="big-icon">🎓</div>
                  <p>{t('gpa.emptyState')}</p>
                </div>
              ) : (
                <div>
                  {/* Native GPA */}
                  <div className="gpa-meter">
                    <div className="gpa-big-num" style={{color: resultColor}}>
                      {result.nativeGpaStr}
                    </div>
                    <div className="gpa-scale-label">{system.scaleLabel}</div>
                    <div className="gpa-classification">{result.classification}</div>
                  </div>

                  {/* 4.0 bar */}
                  <div className="gpa-bar-wrap">
                    <div className="gpa-bar-fill" style={{width:`${result.barPct}%`, background: resultColor}}></div>
                  </div>

                  <div className="gpa-breakdown">
                    <div className="gpa-breakdown-row">
                      <span className="label">{t('gpa.gpa4equiv')}</span>
                      <span className="val" style={{color:resultColor,fontWeight:700}}>{result.gpa4.toFixed(3)}</span>
                    </div>
                    <div className="gpa-breakdown-row">
                      <span className="label">{t('gpa.nativeGpa')} ({system.scaleLabel})</span>
                      <span className="val">{result.nativeGpaStr}</span>
                    </div>
                    <div className="gpa-breakdown-row">
                      <span className="label">{t('gpa.totalCredits')}</span>
                      <span className="val">{result.totalCredits}</span>
                    </div>
                    <div className="gpa-breakdown-row">
                      <span className="label">{t('gpa.totalPoints')}</span>
                      <span className="val">{result.totalPoints}</span>
                    </div>
                    <div className="gpa-breakdown-row">
                      <span className="label">{t('gpa.coursesEntered')}</span>
                      <span className="val">{result.subjects.length}</span>
                    </div>
                    <div className="gpa-breakdown-row">
                      <span className="label">{t('gpa.passFail')}</span>
                      <span className="val" style={{color: result.isPassing ? '#27ae60' : '#e74c3c', fontWeight:700}}>
                        {result.isPassing ? t('gpa.passing') : t('gpa.failing')}
                      </span>
                    </div>
                  </div>

                  <div className="gpa-course-list">
                    <h4>{t('gpa.courseBreakdown')}</h4>
                    {result.subjects.map((s, i) => (
                      <div key={i} className="gpa-course-item">
                        <span className="cname">{s.name}</span>
                        <span className="cgrade">{s.label || s.grade}</span>
                        <span className="cpoints">
                          {s.credits}cr × {s.gpa4.toFixed(2)} = <strong>{s.qualityPoints.toFixed(2)}</strong>
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="gpa-formula-note">
                    <strong>{t('gpa.formula')}</strong>{' '}
                    <code>GPA = Σ(Grade Points × Credits) / Σ(Credits)</code><br />
                    <span style={{fontSize:'0.78rem',color:'var(--slate-light)'}}>
                      {t('gpa.formulaNote', { type: system.scaleType })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SM-2 SPACED REPETITION ENGINE — unchanged from Phase 1
// ─────────────────────────────────────────────────────────────
const RATING_Q      = [0, 2, 4, 5];
const RATING_LABELS = ['Again', 'Hard', 'Good', 'Easy'];
const RATING_EMOJI  = ['😓', '😰', '🙂', '😄'];
const RATING_SUBS   = ["Didn't know", 'Very difficult', 'With effort', 'Instant recall'];

function sm2(card, ratingIdx) {
  const q = RATING_Q[ratingIdx];
  let { interval, repetitions, ef } = card;
  if (q < 3) { repetitions = 0; interval = 1; }
  else {
    if      (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else                        interval = Math.round(interval * ef);
    repetitions += 1;
  }
  ef = Math.max(1.3, parseFloat((ef + 0.1 - (5-q)*(0.08+(5-q)*0.02)).toFixed(2)));
  const next = new Date(); next.setDate(next.getDate() + interval);
  return { ...card, interval, repetitions, ef, nextReview: next.toISOString().slice(0,10) };
}
function todayStr()    { return new Date().toISOString().slice(0,10); }
function isDue(card)   { return !card.nextReview || card.nextReview <= todayStr(); }
function isMastered(c) { return c.interval >= 21; }
function daysUntil(c)  { return Math.max(1, Math.ceil((new Date(c.nextReview)-new Date())/86400000)); }
function makeCard(f,b) { return { id:`${Date.now()}-${Math.random().toString(36).slice(2)}`, front:f.trim(), back:b.trim(), interval:1, repetitions:0, ef:2.5, nextReview:todayStr() }; }
function storeSave(c)  { try { localStorage.setItem('gs_study_v2', JSON.stringify(c)); } catch {} }
function storeLoad()   { try { return JSON.parse(localStorage.getItem('gs_study_v2')||'[]'); } catch { return []; } }

// ─────────────────────────────────────────────────────────────
// STUDY TOOL — unchanged from Phase 1
// ─────────────────────────────────────────────────────────────
function StudyTool() {
  const { t } = useLang();
  const [cards,    setCardsRaw] = useState(() => storeLoad());
  const [screen,   setScreen]   = useState('home');
  const [newF,     setNewF]     = useState('');
  const [newB,     setNewB]     = useState('');
  const [bulk,     setBulk]     = useState('');
  const [bulkMode, setBulkMode] = useState(false);
  const [editId,   setEditId]   = useState(null);
  const [editF,    setEditF]    = useState('');
  const [editB,    setEditB]    = useState('');
  const [queue,    setQueue]    = useState([]);
  const [qIdx,     setQIdx]     = useState(0);
  const [flipped,  setFlipped]  = useState(false);
  const [results,  setResults]  = useState([]);

  const setCards = useCallback(fn => {
    setCardsRaw(prev => { const next = typeof fn==='function'?fn(prev):fn; storeSave(next); return next; });
  }, []);

  function addCard() {
    if (!newF.trim()||!newB.trim()) return;
    setCards(p=>[...p,makeCard(newF,newB)]); setNewF(''); setNewB('');
  }
  function addBulk() {
    const created = bulk.split('\n').filter(l=>l.includes('::')).map(l=>{ const[f,...r]=l.split('::'); return makeCard(f,r.join('::')); }).filter(c=>c.front&&c.back);
    if (!created.length) return;
    setCards(p=>[...p,...created]); setBulk(''); setBulkMode(false);
  }
  function deleteCard(id) { setCards(p=>p.filter(c=>c.id!==id)); }
  function startEdit(card) { setEditId(card.id); setEditF(card.front); setEditB(card.back); }
  function saveEdit() {
    if (!editF.trim()||!editB.trim()) return;
    setCards(p=>p.map(c=>c.id===editId?{...c,front:editF.trim(),back:editB.trim()}:c)); setEditId(null);
  }
  function resetProgress() {
    if (!confirm(t('st.resetConfirm'))) return;
    setCards(p=>p.map(c=>({...c,interval:1,repetitions:0,ef:2.5,nextReview:todayStr()})));
  }
  function startSession() {
    const due=cards.filter(isDue);
    if (!due.length) return;
    setQueue([...due].sort(()=>Math.random()-0.5)); setQIdx(0); setFlipped(false); setResults([]); setScreen('session');
  }
  function rateCard(idx) {
    const card=queue[qIdx];
    setCards(p=>p.map(c=>c.id===card.id?sm2(c,idx):c));
    setResults(p=>[...p,{id:card.id,rating:idx}]);
    const next=qIdx+1; if (next>=queue.length) setScreen('done'); else { setQIdx(next); setFlipped(false); }
  }

  const due=cards.filter(isDue).length, newCount=cards.filter(c=>c.repetitions===0).length;
  const learning=cards.filter(c=>c.repetitions>0&&!isMastered(c)).length, mastered=cards.filter(isMastered).length;
  const avgEF=cards.length?(cards.reduce((s,c)=>s+c.ef,0)/cards.length).toFixed(2):'—';
  const bulkCount=bulk.split('\n').filter(l=>l.includes('::')).length;

  if (screen==='done') {
    const total=results.length, passed=results.filter(r=>r.rating>=2).length;
    const pct=total?Math.round((passed/total)*100):0;
    const tally=[0,1,2,3].map(i=>results.filter(r=>r.rating===i).length);
    return (
      <div className="st-wrap">
        <div className="st-done-card">
          <div style={{fontSize:'3.5rem',marginBottom:'0.75rem'}}>{pct>=80?'🎉':pct>=50?'👍':'💪'}</div>
          <h2 className="st-done-title">{t('st.sessionComplete')}</h2>
          <p className="st-done-sub">{total !== 1 ? t('st.reviewedPlural', {n: total}) : t('st.reviewed', {n: total})}</p>
          <div className="st-done-bar-bg"><div className="st-done-bar-fill" style={{width:`${pct}%`}}/></div>
          <p className="st-done-pct"><strong>{t('st.retention', {n: pct})}</strong></p>
          <div className="st-tally-row">
            {['Again','Hard','Good','Easy'].map((l,i)=>(
              <div key={l} className={`st-tally st-tally-${l.toLowerCase()}`}>
                <span>{tally[i]}</span>
                {t(`st.rate${l}`)}
              </div>
            ))}
          </div>
          <p className="st-done-next">📅 {cards.filter(isDue).length !== 1
            ? t('st.cardsReadyNowPlural', {n: cards.filter(isDue).length})
            : t('st.cardsReadyNow',       {n: cards.filter(isDue).length})
          }</p>
          <button className="st-done-back" onClick={()=>setScreen('home')}>{t('st.backToCards')}</button>
        </div>
      </div>
    );
  }
  if (screen==='session') {
    const card=queue[qIdx], pct=(qIdx/queue.length)*100;
    return (
      <div className="st-wrap">
        <div className="st-session-bar">
          <button className="st-end-btn" onClick={()=>setScreen('home')}>{t('st.endSession')}</button>
          <div className="st-prog-bg"><div className="st-prog-fill" style={{width:`${pct}%`}}/></div>
          <span className="st-counter">{qIdx+1}/{queue.length}</span>
        </div>
        <div className={`st-scene${flipped?' flipped':''}`} onClick={()=>setFlipped(f=>!f)}>
          <div className="st-inner">
            <div className="st-face st-front">
              <span className="st-face-label">{t('st.termQuestion')}</span>
              <p className="st-face-text">{card.front}</p>
              <span className="st-flip-hint">{t('st.clickReveal')}</span>
            </div>
            <div className="st-face st-back">
              <span className="st-face-label">{t('st.answerDef')}</span>
              <p className="st-face-text">{card.back}</p>
            </div>
          </div>
        </div>
        {flipped ? (
          <div className="st-rate-wrap">
            <p className="st-rate-prompt">{t('st.howWell')}</p>
            <div className="st-rate-row">
              {['Again','Hard','Good','Easy'].map((l,i)=>(
                <button key={l} className={`st-rate-btn st-rate-${l.toLowerCase()}`} onClick={()=>rateCard(i)}>
                  <span className="st-rate-emoji">{RATING_EMOJI[i]}</span>
                  <span className="st-rate-label">{t(`st.rate${l}`)}</span>
                  <span className="st-rate-sub">{t(`st.sub${l}`)}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="st-flip-cta">
            <button className="st-flip-btn" onClick={()=>setFlipped(true)}>{t('st.flipCard')}</button>
            <p className="st-flip-sub">{t('st.orClickCard')}</p>
          </div>
        )}
        <div className="st-card-meta">
          <span>{t('st.interval')} <strong>{card.interval}d</strong></span>
          <span>{t('st.reviews')} <strong>{card.repetitions}</strong></span>
          <span>{t('st.ease')} <strong>{card.ef.toFixed(2)}</strong></span>
        </div>
      </div>
    );
  }
  return (
    <div className="st-wrap">
      <div className="st-top">
        <div>
          <p className="section-label">{t('st.label')}</p>
          <h2 className="section-title" style={{marginBottom:'0.2rem'}}>{t('st.title')}</h2>
          <p className="section-desc" style={{marginBottom:0}}>{t('st.desc')}</p>
        </div>
        <button className={`st-study-btn${!due?' st-disabled':''}`} onClick={startSession} disabled={!due}>
          {due ? t('st.studyNow', {n: due}) : t('st.noCardsDue')}
        </button>
      </div>
      <div className="st-stats">
        {[
          {num:due,       label:t('st.dueToday'), cls:'due'},
          {num:newCount,  label:t('st.new'),       cls:'new'},
          {num:learning,  label:t('st.learning'),  cls:'learning'},
          {num:mastered,  label:t('st.mastered'),  cls:'mastered'},
          {num:cards.length, label:t('st.total'), cls:''},
          {num:avgEF,     label:t('st.avgEase'),   cls:'ef'},
        ].map(s=>(
          <div key={s.label} className="st-stat-box">
            <div className={`st-stat-num${s.cls?' '+s.cls:''}`}>{s.num}</div>
            <div className="st-stat-label">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="st-layout">
        <div className="st-add-panel">
          <div className="st-panel-head">
            <h3 className="st-panel-title">{t('st.addCards')}</h3>
            <div className="st-toggle">
              <button className={!bulkMode?'active':''} onClick={()=>setBulkMode(false)}>{t('st.single')}</button>
              <button className={bulkMode?'active':''} onClick={()=>setBulkMode(true)}>{t('st.bulk')}</button>
            </div>
          </div>
          {!bulkMode ? (
            <div className="st-add-form">
              <div className="st-field"><label>{t('st.frontLabel')}</label><textarea rows={3} placeholder={t('st.frontPlaceholder')} value={newF} onChange={e=>setNewF(e.target.value)}/></div>
              <div className="st-field"><label>{t('st.backLabel')}</label><textarea rows={3} placeholder={t('st.backPlaceholder')} value={newB} onChange={e=>setNewB(e.target.value)}/></div>
              <button className="st-add-btn" onClick={addCard} disabled={!newF.trim()||!newB.trim()}>{t('st.addCard')}</button>
            </div>
          ) : (
            <div className="st-add-form">
              <div className="st-field"><label>{t('st.bulkLabel')}</label><textarea rows={9} placeholder={t('st.bulkPlaceholder')} value={bulk} onChange={e=>setBulk(e.target.value)}/></div>
              <div style={{display:'flex',gap:'0.5rem'}}>
                <button className="st-add-btn" style={{flex:1}} onClick={addBulk} disabled={!bulkCount}>{t('st.importCards', {n: bulkCount})}</button>
                <button className="st-cancel-btn" onClick={()=>{setBulk('');setBulkMode(false);}}>{t('st.cancel')}</button>
              </div>
            </div>
          )}
          {cards.length>0&&<button className="st-reset-btn" onClick={resetProgress}>{t('st.resetProgress')}</button>}
          <div className="st-algo-box"><strong>{t('st.algoTitle')}</strong><p>{t('st.algoDesc')}</p></div>
        </div>
        <div className="st-list-panel">
          <div className="st-panel-head">
            <h3 className="st-panel-title">{cards.length !== 1 ? t('st.cardsPlural', {n: cards.length}) : t('st.cards', {n: cards.length})}</h3>
            {cards.length>0&&(<div className="st-legend">
              <span><span className="st-dot due"/>{t('st.due')}</span>
              <span><span className="st-dot learning"/>{t('st.learning')}</span>
              <span><span className="st-dot mastered"/>{t('st.mastered')}</span>
            </div>)}
          </div>
          {cards.length===0 ? (
            <div className="st-empty"><div style={{fontSize:'3rem',marginBottom:'1rem'}}>🧠</div><p>{t('st.noCardsYet')}</p></div>
          ) : (
            <div className="st-card-list">
              {cards.map(card=>{
                const due_=isDue(card),mast_=isMastered(card),cls=mast_?'mastered':due_?'due':'learning';
                const badge = mast_ ? t('st.mastered') : due_ ? t('st.due') : t('st.inDays', {n: daysUntil(card)});
                if (editId===card.id) return (
                  <div key={card.id} className="st-card-item editing">
                    <textarea className="st-edit-ta" rows={2} value={editF} onChange={e=>setEditF(e.target.value)} placeholder={t('st.frontLabel')}/>
                    <textarea className="st-edit-ta" rows={2} value={editB} onChange={e=>setEditB(e.target.value)} placeholder={t('st.backLabel')} style={{marginTop:'0.4rem'}}/>
                    <div style={{display:'flex',gap:'0.4rem',marginTop:'0.4rem'}}>
                      <button className="st-save-btn" onClick={saveEdit}>Save</button>
                      <button className="st-cancel-small" onClick={()=>setEditId(null)}>{t('st.cancel')}</button>
                    </div>
                  </div>
                );
                return (
                  <div key={card.id} className={`st-card-item ${cls}`}>
                    <div className="st-ci-content"><div className="st-ci-front">{card.front}</div><div className="st-ci-back">{card.back}</div></div>
                    <div className="st-ci-meta">
                      <span className={`st-badge ${cls}`}>{badge}</span>
                      <span className="st-ci-stats">{card.repetitions}× · EF {card.ef.toFixed(1)}</span>
                      <div className="st-ci-btns"><button onClick={()=>startEdit(card)} title="Edit">✏️</button><button onClick={()=>deleteCard(card.id)} title="Delete">🗑</button></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
export default function Tools() {
  const router = useRouter();
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState('tool');

  const TABS = [
    { id:'tool',  label:`🎓 ${t('nav.gradeConverter')}` },
    { id:'gpa',   label:`📊 ${t('nav.gpaCalc')}`        },
    { id:'study', label:`🧠 ${t('st.title')}`            },
  ];

  useEffect(() => {
    const tab = router.query.tab;
    if (tab && TABS.some(tb => tb.id === tab)) setActiveTab(tab);
  }, [router.query.tab]);

  function switchTab(id) {
    setActiveTab(id);
    router.replace({pathname:'/tools', query: id !== 'tool' ? {tab:id} : {}}, undefined, {shallow:true});
    window.scrollTo({top:0, behavior:'smooth'});
  }

  return (
    <Layout
      title="GradeScope — Tools"
      description="Grade Converter, GPA Calculator, and Spaced Repetition Study Tool. Convert grades across 31 countries with formula transparency, or calculate your weighted GPA instantly."
      activePage="tools"
    >

      <div className="tools-tab-bar">
        {TABS.map(tab => (
          <button key={tab.id} className={`tools-tab-btn${activeTab===tab.id?' active':''}`} onClick={()=>switchTab(tab.id)}>
            {tab.label}<span className="dropdown-badge" style={{marginLeft:'0.4rem'}}>LIVE</span>
          </button>
        ))}
      </div>

      {activeTab === 'tool'  && <GradeConverter />}
      {activeTab === 'gpa'   && <GpaCalculator />}
      {activeTab === 'study' && <StudyTool />}

      <style jsx global>{`
        .tools-tab-bar{display:flex;gap:.5rem;padding:1rem 2rem;background:var(--ink);border-bottom:2px solid var(--gold);overflow-x:auto;position:sticky;top:62px;z-index:90;}
        .tools-tab-btn{background:transparent;border:1px solid rgba(255,255,255,.15);color:rgba(255,255,255,.6);padding:.5rem 1.1rem;border-radius:6px;font-family:'DM Sans',sans-serif;font-size:.88rem;font-weight:500;cursor:pointer;transition:all .2s;white-space:nowrap;display:flex;align-items:center;}
        .tools-tab-btn:hover{color:#fff;border-color:rgba(255,255,255,.4);}
        .tools-tab-btn.active{background:var(--gold);color:var(--ink);border-color:var(--gold);font-weight:700;}
        .course-row{display:grid;grid-template-columns:1fr 80px 160px 36px;gap:.5rem;margin-bottom:.45rem;align-items:center;}
        .course-input{border:1px solid var(--border);border-radius:6px;padding:.5rem .7rem;font-family:'DM Sans',sans-serif;font-size:.85rem;background:var(--parchment);color:var(--ink);width:100%;transition:border-color .18s;}
        .course-input:focus{outline:none;border-color:var(--gold);}
        .course-input.input-error{border-color:#e74c3c!important;background:#fff5f5;}
        .course-grade-select{border:1px solid var(--border);border-radius:6px;padding:.5rem .5rem;font-family:'DM Mono',monospace;font-size:.78rem;background:var(--parchment);color:var(--ink);width:100%;transition:border-color .18s,background .18s;}
        .course-grade-select:focus{outline:none;border-color:var(--gold);}
        .course-grade-select.grade-a{background:#f0fff4;border-color:#27ae60;color:#1e8449;}
        .course-grade-select.grade-b{background:#ebf5fb;border-color:#2980b9;color:#1a5276;}
        .course-grade-select.grade-c{background:#fffbea;border-color:#f39c12;color:#7d6608;}
        .course-grade-select.grade-d{background:#fef9f0;border-color:#e67e22;color:#935116;}
        .course-grade-select.grade-f{background:#fdf2f2;border-color:#e74c3c;color:#c0392b;}
        .remove-btn{background:none;border:none;color:var(--slate-light);font-size:1.2rem;cursor:pointer;border-radius:4px;padding:0 .3rem;transition:color .15s,background .15s;line-height:1;}
        .remove-btn:hover{color:#e74c3c;background:rgba(231,76,60,.08);}
        .cumulative-result-box{display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap;margin-top:1rem;padding:1rem 1.5rem;background:var(--white);border-radius:8px;border:1px solid var(--border);}
        .st-wrap{max-width:1200px;margin:0 auto;padding:2.5rem 2rem 4rem;}
        .st-top{display:flex;align-items:flex-start;justify-content:space-between;gap:1.5rem;margin-bottom:1.75rem;flex-wrap:wrap;}
        .st-study-btn{background:var(--gold);color:var(--ink);border:none;border-radius:8px;padding:.85rem 1.75rem;font-size:.95rem;font-weight:700;cursor:pointer;white-space:nowrap;transition:background .18s,transform .15s;flex-shrink:0;}
        .st-study-btn:hover:not(.st-disabled){background:#d4a83a;transform:translateY(-1px);}
        .st-disabled{opacity:.5;cursor:not-allowed;}
        .st-stats{display:grid;grid-template-columns:repeat(6,1fr);gap:.85rem;margin-bottom:2rem;}
        @media(max-width:900px){.st-stats{grid-template-columns:repeat(3,1fr);}}
        @media(max-width:480px){.st-stats{grid-template-columns:repeat(2,1fr);}}
        .st-stat-box{background:var(--white);border:1px solid var(--border);border-radius:10px;padding:.85rem;text-align:center;}
        .st-stat-num{font-family:'Playfair Display',serif;font-size:1.7rem;font-weight:700;color:var(--ink);}
        .st-stat-num.due{color:#e74c3c;}.st-stat-num.new{color:var(--gold);}.st-stat-num.learning{color:#3498db;}.st-stat-num.mastered{color:#27ae60;}
        .st-stat-label{font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:var(--slate-light);margin-top:.2rem;}
        .st-layout{display:grid;grid-template-columns:340px 1fr;gap:1.5rem;align-items:start;}
        @media(max-width:860px){.st-layout{grid-template-columns:1fr;}}
        .st-add-panel{background:var(--white);border:1px solid var(--border);border-radius:12px;padding:1.4rem;position:sticky;top:130px;}
        .st-panel-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.1rem;}
        .st-panel-title{font-family:'Playfair Display',serif;font-size:1rem;font-weight:700;margin:0;}
        .st-toggle{display:flex;background:var(--parchment);border-radius:6px;padding:2px;gap:2px;}
        .st-toggle button{background:transparent;border:none;border-radius:4px;padding:.28rem .7rem;font-size:.78rem;cursor:pointer;color:var(--slate-light);font-family:'DM Sans',sans-serif;transition:all .18s;}
        .st-toggle button.active{background:var(--ink);color:#fff;font-weight:600;}
        .st-add-form{display:flex;flex-direction:column;gap:.8rem;}
        .st-field{display:flex;flex-direction:column;gap:.25rem;}
        .st-field label{font-size:.75rem;font-weight:600;color:var(--slate);text-transform:uppercase;letter-spacing:.05em;}
        .st-field textarea{border:1px solid var(--border);border-radius:7px;padding:.6rem .8rem;font-family:'DM Sans',sans-serif;font-size:.87rem;resize:vertical;background:var(--parchment);color:var(--ink);transition:border-color .18s;min-height:66px;}
        .st-field textarea:focus{outline:none;border-color:var(--gold);background:#fff;}
        .st-field code{background:var(--parchment);padding:1px 5px;border-radius:3px;font-size:.8em;}
        .st-add-btn{background:var(--ink);color:var(--gold);border:1.5px solid var(--gold);border-radius:7px;padding:.65rem 1.2rem;font-size:.875rem;font-weight:600;cursor:pointer;transition:background .18s,color .18s;font-family:'DM Sans',sans-serif;}
        .st-add-btn:hover:not(:disabled){background:var(--gold);color:var(--ink);}
        .st-add-btn:disabled{opacity:.45;cursor:not-allowed;}
        .st-cancel-btn{background:transparent;border:1px solid var(--border);border-radius:7px;padding:.65rem 1rem;font-size:.875rem;cursor:pointer;color:var(--slate-light);font-family:'DM Sans',sans-serif;}
        .st-reset-btn{margin-top:.85rem;width:100%;background:transparent;border:1px dashed #e74c3c;color:#e74c3c;border-radius:6px;padding:.45rem;font-size:.78rem;cursor:pointer;transition:background .18s;}
        .st-reset-btn:hover{background:rgba(231,76,60,.08);}
        .st-algo-box{margin-top:1rem;padding:.85rem 1rem;background:var(--parchment);border-left:3px solid var(--gold);border-radius:0 6px 6px 0;font-size:.79rem;color:var(--slate);line-height:1.6;}
        .st-algo-box strong{display:block;margin-bottom:.3rem;}
        .st-list-panel{background:var(--white);border:1px solid var(--border);border-radius:12px;padding:1.4rem;}
        .st-legend{display:flex;gap:.75rem;font-size:.76rem;color:var(--slate-light);}
        .st-legend span{display:flex;align-items:center;gap:.3rem;}
        .st-dot{width:8px;height:8px;border-radius:50%;display:inline-block;}
        .st-dot.due{background:#e74c3c;}.st-dot.learning{background:#3498db;}.st-dot.mastered{background:#27ae60;}
        .st-empty{text-align:center;padding:3rem 1rem;color:var(--slate-light);}
        .st-card-list{display:flex;flex-direction:column;gap:.55rem;max-height:560px;overflow-y:auto;}
        .st-card-item{border:1px solid var(--border);border-left:3px solid var(--border);border-radius:8px;padding:.8rem .95rem;}
        .st-card-item.due{border-left-color:#e74c3c;}.st-card-item.learning{border-left-color:#3498db;}.st-card-item.mastered{border-left-color:#27ae60;}.st-card-item.editing{border-color:var(--gold);}
        .st-ci-content{margin-bottom:.4rem;}
        .st-ci-front{font-size:.87rem;font-weight:600;color:var(--ink);margin-bottom:.15rem;}
        .st-ci-back{font-size:.79rem;color:var(--slate-light);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .st-ci-meta{display:flex;align-items:center;gap:.55rem;flex-wrap:wrap;}
        .st-badge{font-size:.66rem;font-weight:700;padding:2px 6px;border-radius:4px;text-transform:uppercase;letter-spacing:.06em;}
        .st-badge.due{background:rgba(231,76,60,.1);color:#e74c3c;}.st-badge.learning{background:rgba(52,152,219,.1);color:#3498db;}.st-badge.mastered{background:rgba(39,174,96,.1);color:#27ae60;}
        .st-ci-stats{font-size:.74rem;color:var(--slate-light);margin-left:auto;}
        .st-ci-btns{display:flex;gap:.25rem;}
        .st-ci-btns button{background:none;border:none;cursor:pointer;font-size:.82rem;padding:2px 4px;border-radius:4px;opacity:.6;transition:opacity .15s;}
        .st-ci-btns button:hover{opacity:1;}
        .st-edit-ta{width:100%;border:1px solid var(--border);border-radius:6px;padding:.45rem .7rem;font-family:'DM Sans',sans-serif;font-size:.84rem;background:var(--parchment);box-sizing:border-box;}
        .st-edit-ta:focus{outline:none;border-color:var(--gold);}
        .st-save-btn{background:var(--gold);color:var(--ink);border:none;border-radius:5px;padding:.35rem .8rem;font-size:.79rem;font-weight:600;cursor:pointer;}
        .st-cancel-small{background:transparent;border:1px solid var(--border);border-radius:5px;padding:.35rem .8rem;font-size:.79rem;cursor:pointer;color:var(--slate-light);}
        .st-session-bar{display:flex;align-items:center;gap:1rem;margin-bottom:2rem;}
        .st-end-btn{background:transparent;border:1px solid var(--border);border-radius:6px;padding:.45rem .9rem;font-size:.84rem;cursor:pointer;color:var(--slate);white-space:nowrap;}
        .st-end-btn:hover{border-color:var(--slate);}
        .st-prog-bg{flex:1;height:6px;background:var(--border);border-radius:3px;overflow:hidden;}
        .st-prog-fill{height:100%;background:var(--gold);transition:width .4s ease;}
        .st-counter{font-family:'DM Mono',monospace;font-size:.78rem;color:var(--slate-light);white-space:nowrap;}
        .st-scene{perspective:1200px;cursor:pointer;margin-bottom:1.5rem;min-height:220px;user-select:none;}
        .st-inner{position:relative;width:100%;min-height:220px;transform-style:preserve-3d;transition:transform .55s cubic-bezier(.4,0,.2,1);}
        .st-scene.flipped .st-inner{transform:rotateY(180deg);}
        .st-face{position:absolute;width:100%;min-height:220px;backface-visibility:hidden;border:1px solid var(--border);border-radius:14px;padding:2.5rem 2rem;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:var(--white);box-shadow:0 4px 20px rgba(0,0,0,.06);}
        .st-front{border-top:4px solid var(--gold);}
        .st-back{transform:rotateY(180deg);border-top:4px solid #27ae60;background:var(--parchment);}
        .st-face-label{font-family:'DM Mono',monospace;font-size:.63rem;letter-spacing:.12em;text-transform:uppercase;color:var(--slate-light);margin-bottom:.85rem;}
        .st-face-text{font-size:1.2rem;line-height:1.6;color:var(--ink);font-weight:500;max-width:600px;}
        .st-flip-hint{margin-top:1.5rem;font-size:.76rem;color:var(--slate-light);font-style:italic;}
        .st-rate-wrap{text-align:center;margin-bottom:1rem;}
        .st-rate-prompt{font-size:.84rem;color:var(--slate-light);margin-bottom:.85rem;font-style:italic;}
        .st-rate-row{display:flex;gap:.7rem;justify-content:center;flex-wrap:wrap;}
        .st-rate-btn{display:flex;flex-direction:column;align-items:center;gap:.25rem;padding:.8rem 1.3rem;border-radius:10px;border:2px solid transparent;cursor:pointer;transition:all .18s;min-width:86px;font-family:'DM Sans',sans-serif;}
        .st-rate-emoji{font-size:1.35rem;}.st-rate-label{font-size:.86rem;font-weight:700;}.st-rate-sub{font-size:.7rem;opacity:.75;}
        .st-rate-again{background:rgba(231,76,60,.08);color:#c0392b;border-color:rgba(231,76,60,.3);}.st-rate-again:hover{background:rgba(231,76,60,.18);border-color:#e74c3c;}
        .st-rate-hard{background:rgba(243,156,18,.08);color:#b7770d;border-color:rgba(243,156,18,.3);}.st-rate-hard:hover{background:rgba(243,156,18,.18);border-color:#f39c12;}
        .st-rate-good{background:rgba(52,152,219,.08);color:#1a6fa3;border-color:rgba(52,152,219,.3);}.st-rate-good:hover{background:rgba(52,152,219,.18);border-color:#3498db;}
        .st-rate-easy{background:rgba(39,174,96,.08);color:#1e8449;border-color:rgba(39,174,96,.3);}.st-rate-easy:hover{background:rgba(39,174,96,.18);border-color:#27ae60;}
        .st-flip-cta{text-align:center;margin-bottom:1.5rem;}
        .st-flip-btn{background:var(--ink);color:var(--gold);border:2px solid var(--gold);border-radius:8px;padding:.7rem 2rem;font-size:.93rem;font-weight:600;cursor:pointer;transition:all .18s;font-family:'DM Sans',sans-serif;}
        .st-flip-btn:hover{background:var(--gold);color:var(--ink);}
        .st-flip-sub{font-size:.76rem;color:var(--slate-light);margin-top:.45rem;}
        .st-card-meta{display:flex;gap:1.5rem;justify-content:center;margin-top:1rem;font-size:.76rem;color:var(--slate-light);font-family:'DM Mono',monospace;}
        .st-done-card{max-width:480px;margin:2rem auto;text-align:center;background:var(--white);border:1px solid var(--border);border-radius:16px;padding:3rem 2rem;box-shadow:0 8px 32px rgba(0,0,0,.07);}
        .st-done-title{font-family:'Playfair Display',serif;font-size:1.7rem;font-weight:900;margin-bottom:.4rem;}
        .st-done-sub{color:var(--slate-light);font-size:.88rem;margin-bottom:1.4rem;}
        .st-done-bar-bg{background:var(--border);border-radius:999px;height:9px;overflow:hidden;margin-bottom:.45rem;}
        .st-done-bar-fill{height:100%;background:linear-gradient(90deg,var(--gold),#27ae60);border-radius:999px;transition:width .6s ease;}
        .st-done-pct{font-size:1.05rem;font-weight:700;margin-bottom:1.3rem;}
        .st-tally-row{display:flex;gap:.65rem;justify-content:center;margin-bottom:1.3rem;flex-wrap:wrap;}
        .st-tally{display:flex;flex-direction:column;align-items:center;padding:.45rem .8rem;border-radius:8px;font-size:.78rem;font-weight:600;}
        .st-tally span{font-size:1.25rem;font-weight:700;margin-bottom:.15rem;}
        .st-tally-again{background:rgba(231,76,60,.1);color:#c0392b;}.st-tally-hard{background:rgba(243,156,18,.1);color:#b7770d;}.st-tally-good{background:rgba(52,152,219,.1);color:#1a6fa3;}.st-tally-easy{background:rgba(39,174,96,.1);color:#1e8449;}
        .st-done-next{font-size:.83rem;color:var(--slate-light);margin-bottom:1.3rem;}
        .st-done-back{background:var(--ink);color:var(--gold);border:2px solid var(--gold);border-radius:8px;padding:.7rem 1.8rem;font-size:.9rem;font-weight:600;cursor:pointer;transition:all .18s;font-family:'DM Sans',sans-serif;}
        .st-done-back:hover{background:var(--gold);color:var(--ink);}
      `}</style>
    </Layout>
  );
}
