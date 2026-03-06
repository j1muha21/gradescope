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
        .course-grade-select.grade-c{background:#fffbea;border-color:#f39c12;color:#7d6608;}
        .course-grade-select.grade-d{background:#fef9f0;border-color:#e67e22;color:#935116;}
        .course-grade-select.grade-f{background:#fdf2f2;border-color:#e74c3c;color:#c0392b;}
        .remove-btn{background:none;border:none;color:var(--slate-light);font-size:1.2rem;cursor:pointer;border-radius:4px;padding:0 .3rem;transition:color .15s,background .15s;line-height:1;}
        .remove-btn:hover{color:#e74c3c;background:rgba(231,76,60,.08);}
        .cumulative-result-box{display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap;margin-top:1rem;padding:1rem 1.5rem;background:var(--white);border-radius:8px;border:1px solid var(--border);}
      `}</style>
    </Layout>
  );
}
