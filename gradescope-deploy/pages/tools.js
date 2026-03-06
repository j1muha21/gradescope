import Layout from '../components/Layout';
import { useEffect, useState } from 'react';
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

/** Return a realistic example grade for a country's scale (used as input placeholder) */
function getExampleGrade(system) {
  if (!system) return '—';
  const { min, max, pass, direction, scaleType } = system;
  if (scaleType === 'italyScale') return '25';       // Italy 18–30, good grade
  if (scaleType === 'nlScale')    return '7.5';      // Netherlands 1–10
  if (direction === 'desc') {
    // e.g. Germany 1–5: a solid grade is between best(1.0) and pass(4.0), pick ~1.7
    return parseFloat((min + (pass - min) * 0.23).toFixed(1)).toString();
  }
  // Ascending: pick ~75th percentile between pass and max
  const good = pass + (max - pass) * 0.75;
  // Round nicely
  if (max <= 5)   return parseFloat(good.toFixed(1)).toString();
  if (max <= 10)  return parseFloat(good.toFixed(1)).toString();
  if (max <= 20)  return Math.round(good).toString();
  if (max <= 30)  return Math.round(good).toString();
  return Math.round(good).toString();  // percentage scales
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

  // Committed country names (drive the conversion)
  const [src, setSrc] = useState('United States');
  const [dst, setDst] = useState('Germany');

  // Text-field display values — may be mid-type and not yet a valid country
  const [srcText, setSrcText] = useState('United States');
  const [dstText, setDstText] = useState('Germany');

  const [gradeVal, setGradeVal] = useState('');
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState('');

  // Derived: resolved system objects
  const srcSystem = getSystem(src);
  const dstSystem = getSystem(dst);

  // Commit a country when the text field matches a known name
  function commitSrc(val) {
    setSrcText(val);
    if (getSystem(val)) {
      setSrc(val);
      setGradeVal('');
      setResult(null);
      setError('');
    }
  }

  function commitDst(val) {
    setDstText(val);
    if (getSystem(val)) {
      setDst(val);
      setResult(null);
      setError('');
    }
  }

  // If the user leaves the field with an unrecognised name, snap back
  function blurSrc() {
    if (!getSystem(srcText)) setSrcText(src);
  }
  function blurDst() {
    if (!getSystem(dstText)) setDstText(dst);
  }

  function swap() {
    const prevSrc = src, prevDst = dst;
    setSrc(prevDst);  setSrcText(prevDst);
    setDst(prevSrc);  setDstText(prevSrc);
    setGradeVal('');
    setResult(null);
    setError('');
  }

  function convert() {
    setError('');
    setResult(null);

    // Validate country fields
    if (!srcSystem) { setError(`Unknown source country. Pick one from the suggestions.`); return; }
    if (!dstSystem) { setError(`Unknown destination country. Pick one from the suggestions.`); return; }

    // Validate grade input
    const raw = gradeVal.trim();
    if (raw === '') { setError('Please enter a grade value.'); return; }
    const parsed = parseFloat(raw);
    if (isNaN(parsed)) { setError(`"${raw}" is not a valid number.`); return; }

    // Range check with friendly hint
    const { min: sMin, max: sMax } = srcSystem;
    if (parsed < sMin || parsed > sMax) {
      setError(`${parsed} is outside ${src}'s scale. Valid range: ${sMin}–${sMax}.`);
      return;
    }

    // Run conversion
    try {
      const res = convertGPA(parsed, src, dst);
      if (!res || res.error) {
        setError(res?.error || 'Conversion failed. Please check your inputs.');
        return;
      }
      setResult(res);
    } catch (e) {
      setError('Unexpected error: ' + (e?.message || String(e)));
    }
  }

  const steps = result ? buildSteps(result) : [];

  // Scale hint text for the active source country
  const scaleHint = srcSystem
    ? `${srcSystem.flag}  ${srcSystem.scaleLabel}  ·  Pass ≥ ${srcSystem.pass}  ·  Range ${srcSystem.min}–${srcSystem.max}`
    : 'Select a valid source country above';

  return (
    <div className="tool-wrap">
      <div className="tool-header">
        <p className="section-label">{t('tool.label')}</p>
        <h2 className="section-title">{t('tool.title')}</h2>
        <p className="section-desc">{t('tool.desc')}</p>
      </div>

      {/* Shared datalist — used by both country inputs */}
      <datalist id="gc-countries">
        {COUNTRY_LIST.map(c => (
          <option key={c.name} value={c.name}>{c.flag} {c.name}</option>
        ))}
      </datalist>

      <div className="converter-card fade-in">
        <div className="converter-top">
          <h2>{t('tool.cardTitle')}</h2>
          <span className="converter-badge">{t('tool.badge')}</span>
        </div>

        <div className="converter-body">

          {/* ── Country row: text inputs with datalist autocomplete ── */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="gc-src">{t('tool.sourceCountry')}</label>
              <input
                id="gc-src"
                type="text"
                list="gc-countries"
                autoComplete="off"
                className={`form-input${srcSystem ? '' : ' input-unresolved'}`}
                placeholder="e.g. United States"
                value={srcText}
                onChange={e => commitSrc(e.target.value)}
                onBlur={blurSrc}
              />
              {srcSystem && (
                <span className="country-resolved">
                  {srcSystem.flag} {src} · {srcSystem.scaleLabel}
                </span>
              )}
            </div>

            <button className="swap-btn" onClick={swap} title="Swap countries" type="button">⇄</button>

            <div className="form-group">
              <label className="form-label" htmlFor="gc-dst">{t('tool.destCountry')}</label>
              <input
                id="gc-dst"
                type="text"
                list="gc-countries"
                autoComplete="off"
                className={`form-input${dstSystem ? '' : ' input-unresolved'}`}
                placeholder="e.g. Germany"
                value={dstText}
                onChange={e => commitDst(e.target.value)}
                onBlur={blurDst}
              />
              {dstSystem && (
                <span className="country-resolved">
                  {dstSystem.flag} {dst} · {dstSystem.scaleLabel}
                </span>
              )}
            </div>
          </div>

          {/* ── Grade row ── */}
          <div className="grade-row">
            <div className="form-group">
              <label className="form-label" htmlFor="gc-grade">{t('tool.yourGrade')}</label>
              <input
                id="gc-grade"
                type="text"
                inputMode="decimal"
                className="form-input"
                placeholder={srcSystem ? `e.g. ${getExampleGrade(srcSystem)}` : 'Enter your grade'}
                value={gradeVal}
                onChange={e => { setGradeVal(e.target.value); setResult(null); setError(''); }}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); convert(); } }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('tool.gradeHint')}</label>
              <input
                type="text"
                className="form-input grade-hint-field"
                readOnly
                value={scaleHint}
              />
            </div>
          </div>

          {error && (
            <p className="converter-error">⚠ {error}</p>
          )}

          <button className="convert-btn" type="button" onClick={convert}>
            {t('tool.convertBtn')}
          </button>

          {/* Result area */}
          {result && (
            <div className="result-area visible">
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
    setResult(null);
    if (field === 'credits') {
      const n = parseFloat(val);
      if (val !== '' && (isNaN(n) || n <= 0)) {
        setErrors(prev => ({ ...prev, [id]: 'Credits must be a positive number' }));
      } else {
        setErrors(prev => { const e = { ...prev }; delete e[id]; return e; });
      }
    }
  }

  function calculate() {
    // Build subjects array
    const subjects = courses.map(c => ({
      name:    c.name || 'Unnamed',
      grade:   parseFloat(c.grade),
      credits: parseFloat(c.credits) || 0,
    }));

    // Validate
    const newErrors = {};
    courses.forEach(c => {
      if (!c.credits || parseFloat(c.credits) <= 0) {
        newErrors[c.id] = 'Credits must be > 0';
      }
    });
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    const res = calculateGPA(subjects, country);
    if (!res || res.error) {
      setErrors({ _global: res?.error || 'Calculation failed.' });
      return;
    }

    // If cumulative GPA fields are filled, combine
    if (prevGpa && prevCred) {
      const pg = parseFloat(prevGpa);
      const pc = parseFloat(prevCred);
      if (!isNaN(pg) && !isNaN(pc) && pc > 0) {
        const totalQP = pg * pc + res.gpa * res.totalCredits;
        const totalCr = pc + res.totalCredits;
        res.cumulativeGpa = parseFloat((totalQP / totalCr).toFixed(4));
        res.cumulativeCredits = totalCr;
      }
    }

    setResult(res);
    setErrors({});
  }

  function clearAll() {
    setCourses(makeDefaultCourses(country));
    setResult(null);
    setErrors({});
    setPrevGpa('');
    setPrevCred('');
  }

  // Grade color helper for GPA select
  function gradeSelectClass(gpa4) {
    if (gpa4 >= 3.7) return 'grade-a';
    if (gpa4 >= 2.7) return 'grade-b';
    if (gpa4 >= 1.7) return 'grade-c';
    if (gpa4 >= 1.0) return 'grade-d';
    return 'grade-f';
  }

  return (
    <div className="tool-wrap">
      <div className="tool-header">
        <p className="section-label">{t('gpa.label')}</p>
        <h2 className="section-title">{t('gpa.title')}</h2>
        <p className="section-desc">{t('gpa.desc')}</p>
      </div>

      <div className="converter-card fade-in">
        <div className="converter-top">
          <h2>{t('gpa.courseEntry')}</h2>
          <select className="form-select" style={{maxWidth:'220px'}} value={country}
            onChange={e => changeCountry(e.target.value)}>
            {COUNTRY_LIST.map(c => (
              <option key={c.name} value={c.name}>{c.flag} {c.name}</option>
            ))}
          </select>
        </div>

        <div className="converter-body">
          {/* Course rows */}
          <div className="course-header" style={{display:'grid',gridTemplateColumns:'1fr 80px 160px 36px',gap:'.5rem',marginBottom:'.3rem',fontSize:'.72rem',fontWeight:600,color:'var(--slate-light)',textTransform:'uppercase',letterSpacing:'.06em'}}>
            <span>{t('gpa.courseName')}</span>
            <span>{t('gpa.credits')}</span>
            <span>{t('gpa.grade')}</span>
            <span></span>
          </div>

          {courses.map(c => (
            <div key={c.id} className="course-row">
              <input className="course-input" placeholder="Course name"
                value={c.name} onChange={e => updateCourse(c.id, 'name', e.target.value)} />
              <input className={`course-input${errors[c.id] ? ' input-error' : ''}`}
                type="number" min="0.5" step="0.5" placeholder="3"
                value={c.credits} onChange={e => updateCourse(c.id, 'credits', e.target.value)} />
              <select className={`course-grade-select ${gradeSelectClass(
                  bands.find(b => bandMid(b) === parseFloat(c.grade))?.gpa4 ?? 0
                )}`}
                value={c.grade}
                onChange={e => updateCourse(c.id, 'grade', e.target.value)}>
                {bands.map((b, bi) => (
                  <option key={bi} value={bandMid(b)}>
                    {b.label} ({b.min === b.max ? b.min : `${b.min}–${b.max}`})
                  </option>
                ))}
              </select>
              <button className="course-remove-btn" onClick={() => removeCourse(c.id)} title="Remove">✕</button>
            </div>
          ))}

          {errors._global && (
            <p style={{color:'var(--rust)',fontSize:'0.85rem',margin:'0.5rem 0',fontStyle:'italic'}}>⚠ {errors._global}</p>
          )}

          <div style={{display:'flex',gap:'.5rem',marginTop:'.75rem',flexWrap:'wrap'}}>
            <button className="convert-btn" style={{flex:'1 1 auto'}} onClick={addCourse}>{t('gpa.addCourse')}</button>
            <button className="convert-btn" style={{flex:'2 1 auto'}} onClick={calculate}>{t('gpa.calcBtn')}</button>
            <button className="convert-btn" style={{flex:'0 1 auto',background:'transparent',color:'var(--slate)',border:'1px solid var(--border)'}} onClick={clearAll}>{t('gpa.clearAll')}</button>
          </div>

          {/* Cumulative GPA */}
          <div style={{marginTop:'1.5rem',padding:'1rem',background:'var(--parchment)',borderRadius:'10px',border:'1px solid var(--border)'}}>
            <h4 style={{fontSize:'.82rem',fontWeight:600,marginBottom:'.5rem'}}>{t('gpa.cumulativeTitle')}</h4>
            <p style={{fontSize:'.78rem',color:'var(--slate-light)',marginBottom:'.75rem'}}>{t('gpa.cumulativeDesc')}</p>
            <div style={{display:'flex',gap:'.5rem',flexWrap:'wrap',alignItems:'center'}}>
              <input className="course-input" style={{maxWidth:'120px'}} type="number" step="0.01" min="0" max="5"
                placeholder={t('gpa.prevGPA')} value={prevGpa} onChange={e => setPrevGpa(e.target.value)} />
              <input className="course-input" style={{maxWidth:'140px'}} type="number" step="1" min="0"
                placeholder={t('gpa.prevCredits')} value={prevCred} onChange={e => setPrevCred(e.target.value)} />
              <button className="convert-btn" style={{padding:'.45rem 1rem',fontSize:'.8rem'}} onClick={calculate}>{t('gpa.recalc')}</button>
            </div>
          </div>

          {/* GPA Result */}
          {result && (
            <div className="result-area visible" style={{marginTop:'1.5rem'}}>
              <div className="result-main">
                <div className="result-grade-box">
                  <div className="result-label-sm">{t('gpa.resultTitle')}</div>
                  <div className="result-value" style={{color: gradeColor(result.gpa4 ?? result.gpa)}}>
                    {result.gpa.toFixed(2)}
                  </div>
                  <div className="result-scale">{system.scaleLabel}</div>
                </div>
                <div className="result-info">
                  <p>
                    <strong>4.0 GPA Equivalent:</strong> {(result.gpa4 ?? result.gpa).toFixed(2)}<br />
                    <strong>Total Credits:</strong> {result.totalCredits}<br />
                    <strong>Quality Points:</strong> {result.totalQualityPoints?.toFixed(2) ?? '—'}<br />
                    {result.cumulativeGpa != null && (
                      <><strong>Cumulative GPA:</strong> {result.cumulativeGpa.toFixed(2)} ({result.cumulativeCredits} credits)<br /></>
                    )}
                    <strong>Status:</strong>{' '}
                    <span style={{color: result.isPassing ? '#27ae60' : '#e74c3c', fontWeight:700}}>
                      {result.isPassing ? t('gpa.passing') : t('gpa.failing')}
                    </span>
                  </p>
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

      {/* Scale reference table */}
      <div className="converter-card fade-in" style={{marginTop:'1.5rem'}}>
        <div className="converter-top">
          <h2>{t('gpa.scaleRef')}</h2>
        </div>
        <div className="converter-body">
          <table className="scale-table">
            <thead><tr>
              <th>{t('gpa.th.letter')}</th>
              <th>Range</th>
              <th>{t('gpa.th.points')}</th>
              <th>4.0 GPA</th>
            </tr></thead>
            <tbody>
              {bands.map((b, i) => (
                <tr key={i}>
                  <td style={{fontWeight:600}}>{b.label}</td>
                  <td style={{fontFamily:"'DM Mono',monospace"}}>{b.min === b.max ? b.min : `${b.min}–${b.max}`}</td>
                  <td style={{fontFamily:"'DM Mono',monospace"}}>{b.gpa4}</td>
                  <td style={{fontFamily:"'DM Mono',monospace",color:gradeColor(b.gpa4)}}>{b.gpa4.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
      description="Grade Converter and GPA Calculator. Convert grades across 31 countries with formula transparency, or calculate your weighted GPA instantly."
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

      <style jsx global>{`
        .tools-tab-bar{display:flex;gap:.5rem;padding:1rem 2rem;background:var(--ink);border-bottom:2px solid var(--gold);overflow-x:auto;position:sticky;top:62px;z-index:90;}
        .tools-tab-btn{background:transparent;border:1px solid rgba(255,255,255,.15);color:rgba(255,255,255,.6);padding:.5rem 1.1rem;border-radius:6px;font-family:'DM Sans',sans-serif;font-size:.88rem;font-weight:500;cursor:pointer;transition:all .2s;white-space:nowrap;display:flex;align-items:center;}
        .tools-tab-btn:hover{color:#fff;border-color:rgba(255,255,255,.4);}
        .tools-tab-btn.active{background:var(--gold);color:var(--ink);border-color:var(--gold);font-weight:700;}

        /* Country text-input autocomplete */
        .input-unresolved{border-color:#e67e22!important;background:#fffbf5!important;}
        .country-resolved{display:inline-block;margin-top:.3rem;font-size:.76rem;font-weight:600;color:var(--slate-light);letter-spacing:.02em;}

        /* Converter error */
        .converter-error{color:var(--rust);font-size:.86rem;margin:0 0 .9rem;font-style:italic;line-height:1.5;}

        /* Grade hint read-only field */
        .grade-hint-field{cursor:default;font-size:.82rem!important;color:var(--slate-light)!important;font-family:'DM Mono',monospace!important;background:var(--parchment)!important;}

        /* GPA calc */
        .course-row{display:grid;grid-template-columns:1fr 80px 160px 36px;gap:.5rem;margin-bottom:.45rem;align-items:center;}
        .course-input{border:1px solid var(--border);border-radius:6px;padding:.5rem .7rem;font-family:'DM Sans',sans-serif;font-size:.85rem;background:var(--parchment);color:var(--ink);width:100%;transition:border-color .18s;}
        .course-input:focus{outline:none;border-color:var(--gold);}
        .course-input.input-error{border-color:#e74c3c!important;background:#fff5f5;}
        .course-grade-select{border:1px solid var(--border);border-radius:6px;padding:.5rem .5rem;font-family:'DM Mono',monospace;font-size:.78rem;background:var(--parchment);color:var(--ink);width:100%;transition:border-color .18s,background .18s;}
        .course-grade-select:focus{outline:none;border-color:var(--gold);}
        .course-grade-select.grade-a{background:#f0fff4;border-color:#27ae60;color:#1e8449;}
        .course-grade-select.grade-b{background:#ebf5fb;border-color:#2980b9;color:#1a5276;}
        .course-grade-select.grade-c{background:#fef9e7;border-color:#f39c12;color:#7d6608;}
        .course-grade-select.grade-d{background:#fdf2e9;border-color:#e67e22;color:#784212;}
        .course-grade-select.grade-f{background:#fdedec;border-color:#e74c3c;color:#78281f;}
        .course-remove-btn{background:none;border:1px solid var(--border);border-radius:6px;color:var(--slate-light);font-size:.82rem;cursor:pointer;padding:0;width:36px;height:36px;display:flex;align-items:center;justify-content:center;transition:all .15s;}
        .course-remove-btn:hover{border-color:#e74c3c;color:#e74c3c;background:#fdedec;}
        .gpa-course-list{margin-top:1rem;}
        .gpa-course-list h4{font-size:.82rem;font-weight:600;margin-bottom:.5rem;color:var(--ink);}
        .gpa-course-item{display:flex;justify-content:space-between;align-items:center;padding:.4rem .6rem;border-bottom:1px solid var(--border);font-size:.82rem;}
        .gpa-course-item .cname{flex:1;font-weight:500;}
        .gpa-course-item .cgrade{width:80px;text-align:center;font-family:'DM Mono',monospace;font-size:.78rem;}
        .gpa-course-item .cpoints{width:160px;text-align:right;font-family:'DM Mono',monospace;font-size:.78rem;color:var(--slate);}
        .gpa-formula-note{margin-top:1rem;padding:.75rem;background:var(--parchment);border-radius:8px;font-size:.82rem;line-height:1.6;}
        .gpa-formula-note code{background:rgba(0,0,0,.06);padding:.15rem .4rem;border-radius:4px;font-family:'DM Mono',monospace;font-size:.78rem;}
      `}</style>

    </Layout>
  );
}
