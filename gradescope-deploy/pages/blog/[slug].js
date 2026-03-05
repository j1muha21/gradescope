/**
 * pages/blog/[slug].js
 * ─────────────────────────────────────────────────────────────────────────────
 * Renders individual blog articles. All content is static — no CMS, no API.
 * To add a new article: add it to ARTICLES_CONTENT and also add its stub
 * to the ARTICLES array in pages/blog/index.js.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { ARTICLES } from './index';

// ── Full article content ──────────────────────────────────────────────────────
// Each article is an array of { type, content } blocks.
// Types: 'p' (paragraph), 'h2', 'h3', 'ul' (array of items), 'callout', 'table'

const ARTICLES_CONTENT = {

  'how-to-convert-gpa-for-german-university': [
    { type: 'p', content: `Germany is one of the most popular destinations for international students. With world-class universities, low or no tuition fees, and a thriving research culture, it attracts hundreds of thousands of students each year. But before you can enrol, your home country grades need to be converted into the German grading system — and the method used matters enormously.` },
    { type: 'h2', content: `What Is the German Grading System?` },
    { type: 'p', content: `Germany uses a descending numerical scale for university grades. The scale runs from 1.0 (Sehr gut — Very good) to 5.0 (Nicht bestanden — Fail), with 4.0 as the minimum passing grade. Unlike most international systems where higher numbers mean better results, the German system inverts this: 1.0 is the best grade you can receive, and anything above 4.0 is a fail.` },
    { type: 'p', content: `The five main bands are: Sehr gut (1.0–1.5), Gut (1.6–2.5), Befriedigend (2.6–3.5), Ausreichend (3.6–4.0), and Nicht bestanden (4.1–5.0). When German universities receive foreign transcripts, they need to map your home grades onto this descending scale — and this is where the conversion formula becomes critical.` },
    { type: 'h2', content: `The Modified Bavarian Formula` },
    { type: 'p', content: `The most widely accepted method for converting foreign grades to German equivalents is the Modified Bavarian Formula, which was developed in Bavaria and later endorsed by the German Academic Exchange Service (DAAD) as the recommended approach for German universities evaluating international applications.` },
    { type: 'p', content: `The formula works as follows. Let Nmax be the best possible grade in the source country, Nmin be the passing threshold, and Nd be the student's actual grade. The German equivalent (ND) is calculated as: ND = 1 + 3 × (Nmax − Nd) / (Nmax − Nmin). This ensures that a student who just passed their home system also just passes in Germany (German grade: 4.0), while a student with the maximum home grade receives the best possible German grade (1.0).` },
    { type: 'p', content: `The key insight of this formula is that it preserves relative academic position rather than using a simple percentage ratio. A grade of 70% does not always mean the same thing — it depends heavily on how difficult it is to score at the top of the scale in the source country. The Modified Bavarian Formula accounts for this by anchoring conversions to the passing threshold, not just the maximum.` },
    { type: 'h2', content: `Which Countries Need Special Handling?` },
    { type: 'p', content: `Some countries use descending scales themselves — most notably the Philippines (1.0 best, 5.0 fail) and some Eastern European systems. For these, the standard formula is adjusted to account for the inverted direction. Germany also has specific rules for students from countries with no defined passing threshold, where a modified formula using the lower quartile of the scale as a proxy passing mark is sometimes applied.` },
    { type: 'p', content: `Countries with percentage-based systems (China at 0–100%, or some Middle Eastern institutions) are handled differently again. China's passing threshold is typically 60%, so a Chinese student scoring 85% maps to approximately 1.9 on the German scale — equivalent to "Gut" — using the Bavarian formula anchored at 60% as the pass mark.` },
    { type: 'h2', content: `Eligibility and Feststellungsprüfung` },
    { type: 'p', content: `German universities use your converted grade to determine two things: whether you are eligible to apply at all, and whether you need to attend a Studienkolleg (a preparatory college) before direct university entry. If your converted grade falls below a certain threshold — typically around 3.0 to 3.5 depending on the university and subject — you may need to pass the Feststellungsprüfung (assessment examination) even if you meet the basic eligibility criteria.` },
    { type: 'callout', content: `Use GradeScope's grade converter to check your eligibility before applying. Enter your home country grade, select Germany as the destination, and see your German equivalent grade immediately — along with a pass/fail verdict based on the actual German threshold of 4.0.` },
    { type: 'h2', content: `Practical Steps for Your Application` },
    { type: 'p', content: `First, obtain your official transcripts with certified translations if required. German universities typically require official translations into German for all non-German-language documents. Second, check the specific requirements of each university you are applying to — some universities have their own in-house conversion formulas that differ slightly from the standard Bavarian approach. Third, if you are applying through uni-assist (the central application portal used by most German universities), they will perform their own grade conversion as part of the review process. Your GradeScope result gives you a reliable estimate of this conversion but may differ slightly from the official result.` },
    { type: 'p', content: `Finally, note that the converted grade is only one component of a German university application. Language proficiency (typically TestDaF, DSH, or IELTS for English-language programmes), a motivational letter, and subject-specific prerequisites are equally important. Many competitive programmes in fields like engineering, medicine, and computer science have additional entrance requirements beyond the academic grade threshold.` },
    { type: 'h2', content: `Summary` },
    { type: 'p', content: `Converting your grades for a German university application requires understanding both the destination scale (1.0–5.0, descending, with 4.0 as pass) and the correct formula (Modified Bavarian Formula). Use GradeScope for a transparent, step-by-step conversion that shows you exactly how your grade was calculated — then verify your result with the target university or uni-assist before finalising your application.` },
  ],

  'understanding-us-gpa-scale': [
    { type: 'p', content: `The United States Grade Point Average (GPA) system is one of the most universally recognised academic metrics in the world. American universities, graduate schools, scholarship programmes, and many employers use GPA as a primary measure of academic performance. Yet for students educated outside the United States — and even for many Americans — the 4.0 scale can be confusing. This guide explains everything you need to know.` },
    { type: 'h2', content: `What Is a GPA?` },
    { type: 'p', content: `GPA stands for Grade Point Average. It is a single numerical summary of academic performance calculated by dividing the total number of quality points earned by the total number of credit hours attempted. A quality point is calculated for each course by multiplying the grade point value (A = 4.0, B = 3.0, etc.) by the number of credit hours the course is worth.` },
    { type: 'p', content: `For example, if a student takes three courses — Mathematics (3 credits, A), English (3 credits, B+), and History (4 credits, B) — their quality points are: 12 + 9.9 + 12 = 33.9. Dividing by total credits (10) gives a GPA of 3.39. This is a weighted average that correctly gives more weight to courses with more credits.` },
    { type: 'h2', content: `The Standard 4.0 Scale` },
    { type: 'p', content: `The most common US grading scale maps letter grades to points as follows: A+ and A → 4.0, A− → 3.7, B+ → 3.3, B → 3.0, B− → 2.7, C+ → 2.3, C → 2.0, C− → 1.7, D+ → 1.3, D → 1.0, D− → 0.7, F → 0.0. The passing grade is generally considered to be D− (0.7) at the course level, but many programmes require a C or higher to count towards a degree.` },
    { type: 'h2', content: `Cum Laude Classifications` },
    { type: 'p', content: `Many US universities award graduation honours based on GPA thresholds. The traditional Latin designations are: Summa Cum Laude (highest honour, typically GPA ≥ 3.9), Magna Cum Laude (great honour, typically ≥ 3.7), and Cum Laude (with honour, typically ≥ 3.5). Dean's List recognition is typically awarded each semester to students with a term GPA of 3.5 or higher.` },
    { type: 'h2', content: `Alternative Scales: 4.3 and 4.5` },
    { type: 'p', content: `Some US institutions use a 4.3 or 4.5 scale to allow for A+ grades above the standard 4.0 ceiling. On a 4.3 scale, A+ = 4.3, with all other grades shifted proportionally. On a 4.5 scale, A+ = 4.5. These scales give slightly more granularity at the top of the distribution and are used by some high schools and community colleges. When comparing GPAs across institutions, it is important to check which scale was used.` },
    { type: 'h2', content: `How Does the US GPA Compare Internationally?` },
    { type: 'p', content: `The most common international conversions use the World Education Services (WES) framework, which maps percentage scores to 4.0 GPA equivalents as follows: 93–100% → 4.0, 90–92% → 3.7, 87–89% → 3.3, 83–86% → 3.0, 80–82% → 2.7, 77–79% → 2.3, 73–76% → 2.0, 70–72% → 1.7, 67–69% → 1.3, 63–66% → 1.0, 60–62% → 0.7, below 60% → 0.0.` },
    { type: 'p', content: `This means a German student with a 1.5 (Sehr gut) converts to approximately 3.7 on the US 4.0 scale. A French student with 16/20 (Bien) converts to approximately 3.2. An Indian student with 8.5/10 CGPA converts to approximately 3.5. GradeScope performs these conversions using the full two-step normalisation pipeline that accounts for each country's specific passing threshold and scale structure.` },
    { type: 'h2', content: `What GPA Do You Need for Graduate School?` },
    { type: 'p', content: `Requirements vary widely by programme and institution. Competitive graduate programmes at research universities typically look for a GPA of 3.5 or higher (3.7+ for the most selective). Professional programmes in law (JD), medicine (MD), and business (MBA) often have holistic admissions that consider GPA alongside test scores (LSAT, MCAT, GMAT), work experience, and personal statements. For international students, the equivalent of a 3.0 US GPA is often the minimum threshold for admission consideration.` },
    { type: 'callout', content: `Use GradeScope's GPA Calculator to compute your weighted GPA on the US 4.0 scale from your subject grades. Select "United States" as your country, enter your courses with grades and credits, and see your GPA alongside a cumulative calculation that can include prior semesters.` },
  ],

  'india-cgpa-conversion-guide': [
    { type: 'p', content: `India's 10-point CGPA (Cumulative Grade Point Average) system has become the standard for undergraduate and postgraduate programmes at most major Indian universities, including those affiliated with UGC, AICTE, and IIT/NIT frameworks. For students applying to international universities — particularly in the United States, United Kingdom, Germany, and Canada — understanding how the Indian CGPA converts is essential.` },
    { type: 'h2', content: `The Indian 10-Point CGPA System` },
    { type: 'p', content: `Under the UGC (University Grants Commission) framework, grades are awarded on a 10-point scale with O (Outstanding) = 10, A+ (Excellent) = 9, A (Very Good) = 8, B+ (Good) = 7, B (Above Average) = 6, C (Average) = 5, P (Pass) = 4, and F (Fail) = 0. The minimum passing grade is 4.0. A CGPA is computed as the weighted average of grade points across all courses, where each course is weighted by its credit hours.` },
    { type: 'p', content: `However, it is important to note that not all Indian institutions follow this UGC framework. Many older institutions still use a 10-point scale with different letter grade mappings, and some use percentage-based assessment with a conversion table. Private universities may use 4.0 or 5.0 GPA scales aligned with international norms. Always check which specific framework your institution uses before submitting a conversion.` },
    { type: 'h2', content: `Converting Indian CGPA to US GPA` },
    { type: 'p', content: `There is no single universally accepted formula for converting Indian CGPA to a US 4.0 GPA. However, World Education Services (WES) — the most widely used credential evaluation service in North America — applies a linear interpolation approach that maps the 10-point scale to the 4.0 scale based on the percentage equivalent of each grade.` },
    { type: 'p', content: `GradeScope's conversion uses a normalisation pipeline that first converts the CGPA to an internal percentage (maintaining the relationship between the grade, the minimum of 0, the maximum of 10, and the pass threshold of 4.0), then maps this percentage to the 4.0 scale using WES thresholds. A CGPA of 8.5 maps to approximately 3.5 (A−/B+ range). A CGPA of 7.0 maps to approximately 2.7 (B−). A CGPA of 5.5 maps to approximately 1.7 (C−).` },
    { type: 'h2', content: `Converting Indian CGPA to German Grades` },
    { type: 'p', content: `For students applying to German universities, the Modified Bavarian Formula is applied with the Indian scale parameters: maximum (Nmax) = 10, passing threshold (Nmin) = 4. The formula gives: German Grade = 1 + 3 × (10 − CGPA) / (10 − 4). So a CGPA of 8.5 converts to: 1 + 3 × 1.5 / 6 = 1 + 0.75 = 1.75 (Gut — Good). A CGPA of 6.0 converts to: 1 + 3 × 4/6 = 1 + 2.0 = 3.0 (Befriedigend — Satisfactory). A CGPA of 4.0 (minimum pass) converts to exactly 4.0 (Ausreichend — Sufficient, minimum German pass).` },
    { type: 'h2', content: `Converting Indian CGPA to UK Classification` },
    { type: 'p', content: `UK university admissions teams typically use their own in-house scales for evaluating Indian qualifications. However, as a general guide: CGPA 8.5–10.0 is broadly equivalent to a First Class Honours degree, CGPA 7.0–8.4 to a 2:1 (Upper Second), CGPA 5.5–6.9 to a 2:2 (Lower Second), and CGPA 4.0–5.4 to a Third. These are approximate mappings — the actual classification depends heavily on the subject, institution, and individual admissions team evaluation.` },
    { type: 'callout', content: `Enter your CGPA in GradeScope's Grade Converter, select India as the source country and your target country as the destination. The converter will apply the correct formula — Bavarian for Germany, linear for percentage-based systems, classification-based for UK — and show you the result with full methodology.` },
    { type: 'h2', content: `Common Mistakes to Avoid` },
    { type: 'p', content: `The most common mistake international applicants make is applying a simple multiplication (CGPA × 10 to get percentage, then mapping to 4.0). This approach overstates the conversion because it ignores the pass threshold. An Indian student with a 6.0 CGPA has a grade that is 2.0 points above the pass mark of 4.0 — it is not a 60% grade in the same sense as a 60% on a 100-point scale where passing is at 40%. Using a formula that ignores the pass threshold will produce misleadingly high or low results depending on the comparison country's own threshold.` },
  ],

  'uk-degree-classification-explained': [
    { type: 'p', content: `The British Honours degree classification system is one of the most distinctive grading frameworks in the world. Unlike GPA scales or percentage grades, UK degrees are classified into broad tiers — First Class, Upper Second, Lower Second, Third, and Pass — that summarise a student's overall performance across their entire degree programme. For international audiences, understanding these classifications and how they translate is critical for academic and professional recognition.` },
    { type: 'h2', content: `The UK Classification System` },
    { type: 'p', content: `A UK Honours degree (typically three or four years) is classified at graduation based on a weighted average of module grades across all years. The standard classifications are: First Class Honours (1st) — typically 70%+; Upper Second Class Honours (2:1) — typically 60–69%; Lower Second Class Honours (2:2) — typically 50–59%; Third Class Honours (3rd) — typically 40–49%; Pass — below Honours threshold but degree awarded. A distinction is sometimes used at postgraduate (Master's) level for grades above 70%.` },
    { type: 'p', content: `The exact percentage thresholds vary by institution and some universities use different classification algorithms. Some use the best performance in final-year modules as a tiebreaker. Others apply strict arithmetic averages. Students near a classification boundary may be considered for an upgrade at the discretion of the exam board.` },
    { type: 'h2', content: `How the UK System Compares to a US GPA` },
    { type: 'p', content: `A First Class Honours degree is broadly equivalent to a US GPA of 3.7–4.0 (A−/A range). A 2:1 maps to approximately 3.3–3.6 (B+ range). A 2:2 maps to approximately 2.7–3.2 (B/B− range). A Third corresponds roughly to 2.0–2.6 (C range). These are indicative ranges — formal credential evaluation services like WES may produce slightly different results depending on the specific percentage scores on the transcript.` },
    { type: 'h2', content: `How the UK System Compares to German Grades` },
    { type: 'p', content: `German universities and credential evaluation services typically map UK degrees as follows: First Class → Sehr gut (1.0–1.5); 2:1 → Gut (1.6–2.5); 2:2 → Befriedigend (2.6–3.5); Third → Ausreichend (3.6–4.0). Note that a 2:2 is generally considered a passing degree for admission purposes at German universities, though competitive programmes may require at least a 2:1 equivalent (German 2.5 or better).` },
    { type: 'h2', content: `What a 2:1 Really Means for Graduate School` },
    { type: 'p', content: `A 2:1 (Upper Second Class Honours) is widely considered the de facto standard for graduate-level study in the UK. Most postgraduate programmes at UK universities require at minimum a 2:1 from a recognised institution. For international students, many UK graduate admissions teams convert equivalent foreign degrees to UK classification to assess eligibility. A GPA of 3.3 or higher on a US 4.0 scale, a German grade of 2.5 or better, or an Indian CGPA of 7.0+ is typically treated as equivalent to a 2:1 for admission purposes.` },
    { type: 'callout', content: `Use GradeScope to convert a UK degree classification to any of 31 international grading systems. Select United Kingdom as the source country, enter a percentage score (e.g. 65 for a solid 2:1), and see the equivalent in Germany, India, France, the United States, or any other supported destination.` },
    { type: 'h2', content: `Professional and Employment Contexts` },
    { type: 'p', content: `In UK employment, a 2:1 has historically been used as a minimum threshold by many large employers and graduate schemes. However, this has been shifting in recent years as more firms adopt holistic recruitment processes. For international employers, UK degree classifications need to be explained — a 2:1 is not immediately interpretable in countries that use GPA or percentage systems. Having a conversion on hand (GPA equivalent, percentage equivalent) can significantly strengthen your application materials when applying abroad.` },
  ],

  'what-is-bavarian-formula': [
    { type: 'p', content: `When converting academic grades between different countries, the choice of formula is not merely a technical detail — it determines whether the conversion preserves the academic meaning of a result or distorts it. The Modified Bavarian Formula is widely regarded as the most academically rigorous approach to international grade conversion. This article explains what it is, how it works, and why it matters.` },
    { type: 'h2', content: `The Problem With Simple Ratios` },
    { type: 'p', content: `The most intuitive approach to grade conversion is a simple linear ratio: divide your grade by the maximum possible grade to get a percentage, then map that percentage to the destination scale. This seems reasonable, but it fails in an important way: it ignores the passing threshold.` },
    { type: 'p', content: `Consider a student with a grade of 60 out of 100 in a country where the passing threshold is 40. This student has passed — they are above the minimum. Now consider a German student with a grade of 4.0 (the minimum passing grade on a 1.0–5.0 descending scale). Both students are at the same relative academic position: they have just passed. But a simple ratio would convert 60/100 to 60% (a mediocre-to-failing US grade) and 4.0/5.0 to 80% (a solid B). These two students are at equivalent academic levels, but simple ratio conversion produces dramatically different results.` },
    { type: 'h2', content: `The Bavarian Formula: How It Works` },
    { type: 'p', content: `The Modified Bavarian Formula solves this by anchoring the conversion at the passing threshold rather than just at the extremes of the scale. It was originally developed by the University of Bavaria and later formally endorsed by the German Academic Exchange Service (DAAD) as the recommended approach for evaluating foreign grades for German university admission.` },
    { type: 'p', content: `The formula states: German Grade (ND) = 1 + 3 × (Nmax − Nd) / (Nmax − Nmin), where Nmax is the best possible grade in the source country, Nmin is the minimum passing grade, and Nd is the student's actual grade. This formula has two key properties: when Nd = Nmax (best possible), ND = 1.0 (best German grade); when Nd = Nmin (just passing), ND = 4.0 (just passing in Germany). All intermediate grades are interpolated linearly between these two anchor points.` },
    { type: 'h2', content: `Descending Scales and the Modified Version` },
    { type: 'p', content: `The formula was originally designed for ascending scales (higher = better). For descending scales — like Germany's own 1.0–5.0 system, or the Philippines' 1.0–5.0 system — a modified version is applied. GradeScope uses a split-point formula for descending scales: grades above the passing threshold use one interpolation formula, grades below use another, ensuring that the passing point always maps to the destination country's passing threshold regardless of scale direction.` },
    { type: 'callout', content: `Every time you use GradeScope to convert a grade to or from Germany, the Modified Bavarian Formula is applied. The step-by-step breakdown in the converter shows you exactly which formula was used, what the anchor points are, and how each calculation step was performed.` },
    { type: 'h2', content: `Why It Matters for Real Applicants` },
    { type: 'p', content: `The practical impact of using the Bavarian formula rather than a simple ratio can be significant. An Indian student with a CGPA of 7.0/10 (pass = 4.0) using simple ratio gets: 7/10 = 70% → approximately B/B+ on US scale. Using the Bavarian formula: ND = 1 + 3 × (10 − 7) / (10 − 4) = 1 + 1.5 = 2.5 (German Gut). The internal percentage equivalent is correctly computed as 70% on the above-pass portion of the scale — preserving the student's relative academic position. The formula properly captures that this student is in the upper half of passing students, not merely above the raw midpoint of the scale.` },
    { type: 'h2', content: `Limitations and Variations` },
    { type: 'p', content: `The Bavarian formula is not universally applied by all institutions. Some universities use their own proprietary conversion tables, particularly for applicants from countries with well-established equivalency frameworks (e.g., the UK). Additionally, the formula requires knowing the exact passing threshold for the source country, which can vary by institution within a country. GradeScope uses the national standard passing threshold for each of the 31 supported countries, which is accurate for the majority of cases but may differ for specific institutional variations. Always verify your converted grade with the target institution.` },
  ],

  'gpa-calculation-methods-by-country': [
    { type: 'p', content: `Ask a student from the United States what their GPA is and they will give you a number between 0.0 and 4.0. Ask a student from Germany and they will give you a number between 1.0 and 5.0 — but lower means better. Ask a French student and they will talk about a mark out of 20, probably with a comment about how nobody ever gets above 18. Every country has its own conventions, and understanding them side by side is essential for anyone navigating international academic comparison.` },
    { type: 'h2', content: `United States: The 4.0 Scale` },
    { type: 'p', content: `The US GPA is a weighted average of grade points across all courses. Grade points: A = 4.0, B = 3.0, C = 2.0, D = 1.0, F = 0. Quality points are calculated per course (grade points × credit hours) and the GPA is Σ(quality points) / Σ(credit hours). The minimum passing grade is typically D (1.0), though most degree programmes require at least a C (2.0) to count course credit. Cumulative GPA (CGPA) tracks performance across all semesters, while term/semester GPA tracks individual terms.` },
    { type: 'h2', content: `Germany: The 1–5 Descending Scale` },
    { type: 'p', content: `Germany uses a descending scale where 1.0 is the best possible grade (Sehr gut) and 5.0 is an outright fail. The passing threshold is 4.0 (Ausreichend). Semester marks are averaged across all courses, usually without credit weighting (though some universities do weight by hours per week in class). Final degree grades combine coursework and thesis marks, with the thesis often carrying significant weight. The descending direction regularly confuses international observers — a German "1.0" is excellent, not failing.` },
    { type: 'h2', content: `France: The 0–20 Scale` },
    { type: 'p', content: `France uses a 0–20 scale with 10/20 as the passing mark. Grades above 16 are rare and culturally significant: 16–17 is considered Très Bien (Very Good), 14–15 is Bien (Good), 12–13 is Assez Bien (Fairly Good), 10–11 is Passable (Barely Passing). French academic culture considers a 15 or higher as genuinely exceptional. The average French university grade is typically 11–13. This has important implications for conversion: a student with 14/20 is academically strong, even though 14/20 = 70% might suggest otherwise to someone accustomed to the US scale.` },
    { type: 'h2', content: `India: 10-Point CGPA and Percentage` },
    { type: 'p', content: `India uses a 10-point CGPA system at most universities since UGC standardisation, with a passing threshold of 4.0. However, many older institutions still use percentage-based assessment, and some professional colleges (particularly engineering and medicine) award marks as direct percentages. The relationship between percentage and CGPA varies by institution. A common rough conversion used by Indian universities is Percentage ≈ CGPA × 9.5, though this is approximate and does not account for the pass threshold correctly.` },
    { type: 'h2', content: `China: The 100-Point and 4.0 Hybrid` },
    { type: 'p', content: `Chinese universities typically use a 100-point scale (百分制) with 60 as the passing mark. Many Chinese universities also maintain a parallel 4.0 GPA for international reporting purposes. The 100-point to 4.0 mapping typically used in China itself is: 90–100 → 4.0, 80–89 → 3.0, 70–79 → 2.0, 60–69 → 1.0, below 60 → 0. GradeScope's conversion treats Chinese grades as percentage-based with a 60% pass threshold, which correctly preserves relative academic position when converting to other systems.` },
    { type: 'h2', content: `Philippines: The 1–5 Descending Scale (Different from Germany)` },
    { type: 'p', content: `The Philippines also uses a 1–5 scale, but with different band meanings than Germany. 1.0 is the best grade (Excellent) and 5.0 is a failure. Passing threshold is 3.0 (rather than Germany's 4.0). Decimal grades are common: a student might receive 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0, etc. The Modified Bavarian Formula with Nmin = 3.0 (pass) and Nmax = 1.0 (best, descending) is applied for conversions.` },
    { type: 'callout', content: `GradeScope's GPA Calculator supports all 31 countries. Select your country, enter your subject grades and credit hours, and receive your GPA in both the native scale and the 4.0 equivalent — along with a classification label appropriate for your system.` },
    { type: 'h2', content: `Netherlands: 1–10 with Pass at 5.5` },
    { type: 'p', content: `The Netherlands uses a 1–10 scale with the unusual pass threshold of 5.5 (not 5.0 or 6.0). Grades below 5.5 are a fail, and above 5.5 is a pass. Grades of 9 or 10 are exceptionally rare — a Dutch student with an 8 is performing very well. The 5.5 threshold requires a split-point formula for accurate conversion: grades between 1–5.5 are mapped linearly to the fail zone of the destination scale, and grades between 5.5–10 are mapped to the pass zone.` },
  ],

  'wes-credential-evaluation-guide': [
    { type: 'p', content: `World Education Services (WES) is the most widely used credential evaluation service in the United States and Canada. If you are applying to a US or Canadian university, graduate programme, professional licensing body, or employer that requires foreign credential evaluation, you will almost certainly need a WES evaluation at some point. This guide explains what WES is, how the evaluation process works, and how GradeScope's conversions relate to WES methodology.` },
    { type: 'h2', content: `What Is WES?` },
    { type: 'p', content: `WES (World Education Services) is a non-profit organisation founded in 1974 that evaluates international academic credentials for use in the United States and Canada. WES issues standardised evaluation reports that convert foreign degrees and transcripts into US or Canadian equivalents. These reports are accepted by thousands of universities, employers, licensing bodies, and immigration authorities as official documentation of international academic qualifications.` },
    { type: 'p', content: `WES is not a government agency and does not grant degrees or certifications itself. It translates foreign credentials into a format that North American institutions can understand and compare. A WES evaluation report includes: a description of the foreign degree and its North American equivalent, a grade conversion to either US letter grades or Canadian percentage grades, and the converted GPA on the appropriate scale.` },
    { type: 'h2', content: `Types of WES Evaluations` },
    { type: 'p', content: `WES offers two main evaluation products. The Document-by-Document evaluation (Course-by-Course report) provides a course-level breakdown of all subjects, with individual grade conversions and a cumulative GPA. This is the type most often required by US universities for graduate admissions. The Basic (Document-by-Document without course analysis) evaluation provides degree-level equivalency without course breakdown — this is typically sufficient for employment verification purposes.` },
    { type: 'h2', content: `WES Grade Conversion Methodology` },
    { type: 'p', content: `WES converts foreign grades to US letter grades using country-specific conversion tables that have been developed over decades of evaluation practice. These tables are not published in full detail publicly, but WES has confirmed that they use a combination of pass-threshold anchoring, linear interpolation, and country-specific adjustments — broadly consistent with the Modified Bavarian Formula approach for German-style scales and linear normalisation for percentage-based systems.` },
    { type: 'p', content: `GradeScope's conversion methodology is aligned with WES principles: we use the same two-step normalisation approach (source → internal percentage → destination), apply the Bavarian formula for descending scales, and use WES thresholds for the percentage-to-4.0 mapping (93%+ = 4.0, 90–92% = 3.7, etc.). Your GradeScope result should closely match a WES evaluation, but official WES evaluations may include additional nuances specific to your institution or country.` },
    { type: 'h2', content: `How to Prepare Your WES Application` },
    { type: 'p', content: `To request a WES evaluation, you need to create a WES account and specify the type of evaluation required. WES will then send you (or directly request from your institution) a list of required documents. These typically include: official transcripts sent directly from your university to WES, certified copies of your degree certificates and diplomas, English translations of all documents (if originals are not in English), and in some cases, course descriptions or syllabus documents.` },
    { type: 'p', content: `Processing times vary from two to seven weeks depending on the country and evaluation type. Rush processing is available for an additional fee. Ensure all documents are sent directly from your institution to WES — self-submitted transcripts are not accepted for official evaluations.` },
    { type: 'callout', content: `Use GradeScope before submitting your WES application to estimate your GPA conversion. Enter your foreign grades, select your country, and choose United States as the destination. GradeScope will show your estimated 4.0 GPA equivalent using the same methodology WES employs — helping you predict your evaluation result and prepare your applications accordingly.` },
    { type: 'h2', content: `WES vs Other Credential Evaluation Services` },
    { type: 'p', content: `WES is the most widely recognised service for US and Canadian purposes, but it is not the only option. ECE (Educational Credential Evaluators) and Josef Silny & Associates are other NACES-member services used by many institutions. For Canadian immigration specifically, WES has a designated status with Immigration, Refugees and Citizenship Canada (IRCC), making it the default choice for Express Entry applicants. For European institutions, WES is less relevant — European credential evaluation is typically handled through the ENIC-NARIC network or country-specific bodies such as anabin in Germany.` },
  ],
};

// ── Static generation ─────────────────────────────────────────────────────────

export async function getStaticPaths() {
  return {
    paths: ARTICLES.map(a => ({ params: { slug: a.slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const article = ARTICLES.find(a => a.slug === params.slug);
  if (!article) return { notFound: true };
  const blocks  = ARTICLES_CONTENT[params.slug] || [];
  return { props: { article, blocks } };
}

// ── Render helpers ────────────────────────────────────────────────────────────

function ArticleBlock({ block }) {
  const prose = { fontSize: '0.97rem', color: 'var(--slate)', lineHeight: 1.85, marginBottom: '1.25rem' };

  switch (block.type) {
    case 'p':
      return <p style={prose}>{block.content}</p>;

    case 'h2':
      return (
        <h2 style={{
          fontFamily: "'Playfair Display',serif",
          fontSize: '1.35rem', fontWeight: 700,
          color: 'var(--ink)', marginTop: '2rem', marginBottom: '0.75rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <span style={{width:'3px',height:'1.2em',background:'var(--gold)',borderRadius:'2px',display:'inline-block'}}></span>
          {block.content}
        </h2>
      );

    case 'h3':
      return (
        <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:'1.1rem',fontWeight:700,color:'var(--ink)',marginTop:'1.5rem',marginBottom:'0.6rem'}}>
          {block.content}
        </h3>
      );

    case 'ul':
      return (
        <ul style={{paddingLeft:'1.5rem',marginBottom:'1.25rem'}}>
          {block.content.map((item, i) => (
            <li key={i} style={{...prose, marginBottom:'0.4rem'}}>{item}</li>
          ))}
        </ul>
      );

    case 'callout':
      return (
        <div style={{
          background:'rgba(201,153,58,0.08)',
          border:'1px solid rgba(201,153,58,0.3)',
          borderLeft:'4px solid var(--gold)',
          borderRadius:'0 10px 10px 0',
          padding:'1.1rem 1.5rem',
          marginBottom:'1.5rem',
          fontSize:'0.9rem',
          color:'var(--slate)',
          lineHeight: 1.75,
        }}>
          💡 {block.content}
        </div>
      );

    default:
      return null;
  }
}

// ── Page component ────────────────────────────────────────────────────────────

export default function BlogArticle({ article, blocks }) {
  const canonical = `https://www.gradescope.io/blog/${article.slug}`;
  const pageTitle = `${article.title} — GradeScope`;

  // Related articles (up to 3, different from current)
  const related = ARTICLES.filter(a => a.slug !== article.slug).slice(0, 3);

  return (
    <Layout title={pageTitle} activePage="blog">
      <Head>
        <meta name="description" content={article.excerpt} />
        <link rel="canonical" href={canonical} />

        <meta property="og:type"        content="article" />
        <meta property="og:url"         content={canonical} />
        <meta property="og:title"       content={pageTitle} />
        <meta property="og:description" content={article.excerpt} />
        <meta property="og:site_name"   content="GradeScope" />

        <meta name="twitter:card"        content="summary" />
        <meta name="twitter:title"       content={pageTitle} />
        <meta name="twitter:description" content={article.excerpt} />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": article.title,
          "description": article.excerpt,
          "datePublished": article.date,
          "publisher": { "@type": "Organization", "name": "GradeScope", "url": "https://www.gradescope.io" },
          "url": canonical,
        })}} />
      </Head>

      {/* HERO */}
      <section style={{background:'var(--ink)',padding:'3.5rem 2rem 2.5rem',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 60% 60% at 20% 50%,rgba(201,153,58,0.10),transparent)',pointerEvents:'none'}}></div>
        <div style={{maxWidth:'780px',margin:'0 auto'}}>
          <nav style={{fontSize:'0.78rem',color:'rgba(255,255,255,0.35)',marginBottom:'1.25rem'}}>
            <Link href="/" style={{color:'rgba(255,255,255,0.35)',textDecoration:'none'}}>Home</Link>
            {' / '}
            <Link href="/blog" style={{color:'rgba(255,255,255,0.35)',textDecoration:'none'}}>Blog</Link>
            {' / '}
            <span style={{color:'var(--gold)'}}>{article.category}</span>
          </nav>
          <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'1rem'}}>
            <span style={{
              fontFamily:"'DM Mono',monospace",fontSize:'0.64rem',letterSpacing:'0.12em',
              textTransform:'uppercase',color:'var(--gold)',
              background:'rgba(201,153,58,0.15)',borderRadius:'4px',padding:'2px 8px',
            }}>
              {article.category}
            </span>
            <span style={{fontSize:'0.78rem',color:'rgba(255,255,255,0.35)',fontFamily:"'DM Mono',monospace"}}>
              {new Date(article.date).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}
              {' · '}{article.readTime}
            </span>
          </div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:'clamp(1.6rem,4vw,2.4rem)',fontWeight:900,color:'#fff',lineHeight:1.2,letterSpacing:'-0.02em',marginBottom:'1rem'}}>
            {article.emoji} {article.title}
          </h1>
          <p style={{fontSize:'1rem',color:'rgba(255,255,255,0.6)',lineHeight:1.75}}>
            {article.excerpt}
          </p>
        </div>
      </section>

      {/* ARTICLE BODY */}
      <article style={{maxWidth:'780px',margin:'0 auto',padding:'2.5rem 1.5rem 1rem'}}>
        {blocks.map((block, i) => <ArticleBlock key={i} block={block} />)}
      </article>

      {/* CTA */}
      <div style={{maxWidth:'780px',margin:'0 auto',padding:'0 1.5rem 2rem'}}>
        <div style={{background:'var(--ink)',borderRadius:'14px',padding:'2.5rem',textAlign:'center'}}>
          <p style={{fontFamily:"'DM Mono',monospace",fontSize:'0.68rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.75rem'}}>
            Put It Into Practice
          </p>
          <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:'1.4rem',fontWeight:700,color:'#fff',marginBottom:'0.75rem'}}>
            Live Converter · GPA Calculator · Study Tool
          </h3>
          <p style={{fontSize:'0.88rem',color:'rgba(255,255,255,0.55)',marginBottom:'1.5rem'}}>
            Apply what you've learned — convert your grades or calculate your GPA with full formula transparency.
          </p>
          <div style={{display:'flex',gap:'0.75rem',justifyContent:'center',flexWrap:'wrap'}}>
            <Link href="/tools" className="btn-primary">Grade Converter →</Link>
            <Link href="/tools?tab=gpa" className="btn-secondary">GPA Calculator →</Link>
          </div>
        </div>
      </div>

      {/* RELATED */}
      <div style={{maxWidth:'780px',margin:'0 auto',padding:'0 1.5rem 4rem'}}>
        <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:'1.1rem',fontWeight:700,marginBottom:'1.25rem',color:'var(--ink)'}}>
          More Articles
        </h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'1rem'}}>
          {related.map(rel => (
            <Link key={rel.slug} href={`/blog/${rel.slug}`} style={{textDecoration:'none'}}>
              <div style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:'10px',padding:'1.1rem',transition:'box-shadow 0.2s'}}
                onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow='none'}
              >
                <span style={{fontSize:'1.5rem',display:'block',marginBottom:'0.5rem'}}>{rel.emoji}</span>
                <p style={{fontSize:'0.84rem',fontWeight:600,color:'var(--ink)',lineHeight:1.4,marginBottom:'0.4rem'}}>{rel.title}</p>
                <span style={{fontSize:'0.75rem',color:'var(--gold)',fontWeight:600}}>Read →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </Layout>
  );
}
