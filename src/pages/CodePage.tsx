import { Fragment, useEffect, useState } from 'react';
import { highlight } from '../lib/highlight';
import { codingProblems } from '../content/code';
import { dailyIndex } from '../lib/daily';
import { getAttempt, updateAttempt, useProgress, type Ctx } from '../lib/progress';
import { guestMode } from '../lib/auth';
import { judge, STARTER_CODE, STARTER_CODE_CPP, usingInlineRunner, VERDICT_LABEL, type JudgeReport, type Language } from '../lib/judge';
import { Rich } from '../components/Rich';
import { CodeEditor } from '../components/CodeEditor';
import { addSubmission, submissionsFor, useSubmissions, type Submission } from '../lib/submissions';
import { Badge, ChallengeHeading } from '../components/common';

export function CodePage({ today, id }: { today: number; id?: string }) {
  useProgress();
  const allSubmissions = useSubmissions();
  const daily = codingProblems[dailyIndex('code', today)];
  const problem = id ? codingProblems.find((x) => x.id === id)! : daily;
  const isDaily = !id || id === daily.id;
  const ctx: Ctx = isDaily ? today : 'practice';
  const a = getAttempt('code', problem.id, ctx);

  const guest = guestMode();
  const [lang, setLang] = useState<Language>(guest ? 'js' : a?.lang ?? 'js');
  const [jsCode, setJsCode] = useState(a?.code ?? STARTER_CODE);
  const [cppCode, setCppCode] = useState(a?.codeCpp ?? STARTER_CODE_CPP);
  const code = lang === 'cpp' ? cppCode : jsCode;
  const setCode = lang === 'cpp' ? setCppCode : setJsCode;
  const starter = lang === 'cpp' ? STARTER_CODE_CPP : STARTER_CODE;
  const [report, setReport] = useState<(JudgeReport & { mode: 'samples' | 'full' }) | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [errorLines, setErrorLines] = useState<number[]>([]);
  const [showTags, setShowTags] = useState(false);
  const [showEditorial, setShowEditorial] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const save = () => updateAttempt('code', problem.id, ctx, { code: jsCode, codeCpp: cppCode, lang });

  async function run(mode: 'samples' | 'full') {
    save();
    setRunning(mode === 'samples' ? 'Running samples…' : 'Judging…');
    setReport(null);
    await new Promise((r) => setTimeout(r, 30));
    const rep = await judge(problem, code, mode, (d, t) => setRunning(`${mode === 'samples' ? 'Sample' : 'Test'} ${Math.min(d + 1, t)} of ${t}…`), lang);
    setRunning(null);
    setReport({ ...rep, mode });
    setErrorLines(rep.verdict === 'CE' && lang === 'cpp' ? compilerErrorLines(rep.results[0]?.message ?? '') : []);
    if (mode === 'full') {
      const first = rep.results.find((r) => r.verdict !== 'AC');
      addSubmission({
        problemId: problem.id, ctx, lang, code, verdict: rep.verdict, total: rep.results.length, failed: rep.failedCount,
        firstFailed: rep.verdict === 'CE' ? undefined : first ? first.index + 1 : undefined, maxTimeMs: rep.maxTimeMs,
        message: first?.message?.slice(0, 600),
      });
    }
    if (mode === 'full') updateAttempt('code', problem.id, ctx, { attempts: (a?.attempts ?? 0) + 1, solved: rep.verdict === 'AC', code: jsCode, codeCpp: cppCode, lang });
  }

  // An accepted submission always counts, so recover attempts that were accepted before this rule existed.
  const hasAccepted = allSubmissions.some((x) => x.problemId === problem.id && x.ctx === ctx && x.verdict === 'AC');
  useEffect(() => {
    if (hasAccepted && !a?.solved) updateAttempt('code', problem.id, ctx, { solved: true });
  }, [hasAccepted, a?.solved, problem.id, ctx]);

  const solved = !!a?.solved || hasAccepted;
  const editorialOpen = showEditorial || solved || !!a?.revealed;

  return (
    <article className="page wide">
      <ChallengeHeading
        section="code"
        isDaily={isDaily}
        today={today}
        title={problem.title}
        meta={
          <>
            <Badge>Rating {problem.rating}</Badge>
            <Badge>Time limit {problem.timeLimitMs / 1000} s</Badge>
            {showTags ? problem.tags.map((t) => <Badge key={t} tone="muted">{t}</Badge>) : (
              <button className="linklike" onClick={() => setShowTags(true)}>Show tags</button>
            )}
            {solved && <Badge tone="ok">Accepted</Badge>}
          </>
        }
      />

      <div className="split">
        <div className="split-left">
          <section className="panel statement">
            <Rich text={problem.legend} />
            <h3 className="smallcaps">Input</h3>
            <Rich text={problem.inputSpec} />
            <h3 className="smallcaps">Output</h3>
            <Rich text={problem.outputSpec} />
            {problem.samples.map((s, i) => (
              <div className="sample" key={i}>
                <h3 className="smallcaps">Example {problem.samples.length > 1 ? i + 1 : ''}</h3>
                <div className="sample-grid">
                  <div>
                    <div className="sample-label">
                      Input <button className="linklike" onClick={() => navigator.clipboard?.writeText(s.input).catch(() => {})}>copy</button>
                    </div>
                    <pre>{s.input.trimEnd()}</pre>
                  </div>
                  <div>
                    <div className="sample-label">Output</div>
                    <pre>{s.output.trimEnd()}</pre>
                  </div>
                </div>
                {s.note && <Rich className="note" text={s.note} />}
              </div>
            ))}
          </section>
        </div>

        <div className="split-right">
          <section className="panel editor-panel">
            <div className="editor-head">
              <span className="smallcaps">
                Solution ·{' '}
                <select value={lang} disabled={!!running} onChange={(e) => { setLang(e.target.value as Language); setReport(null); setErrorLines([]); updateAttempt('code', problem.id, ctx, { lang: e.target.value as Language }); }} aria-label="Language">
                  <option value="js">JavaScript</option>
                  <option value="cpp" disabled={guest}>{guest ? 'C++20 (sign in)' : 'C++20'}</option>
                </select>
              </span>
              {confirmReset ? (
                <span className="hint-text">
                  Discard your code?{' '}
                  <button className="linklike" onClick={() => { setCode(starter); setConfirmReset(false); }}>yes, reset</button>{' '}
                  <button className="linklike" onClick={() => setConfirmReset(false)}>cancel</button>
                </span>
              ) : (
                <button className="linklike" onClick={() => setConfirmReset(true)}>reset</button>
              )}
            </div>
            <CodeEditor value={code} onChange={(v) => { setCode(v); if (errorLines.length) setErrorLines([]); }} lang={lang} errorLines={errorLines} onSubmit={() => run('full')} onBlur={save} />
            <div className="row">
              <button className="btn" disabled={!!running} onClick={() => run('samples')}>Run examples</button>
              <button className="btn primary" disabled={!!running} onClick={() => run('full')}>Submit</button>
              <span className="hint-text">Submit runs the hidden tests, including maximal inputs. Ctrl/⌘ + Enter also submits.</span>
            </div>
            {running && <p className="feedback muted">{running}</p>}
            {report?.mode === 'full' && report.verdict === 'AC' && (
              <p className="feedback ok">{ctx === 'practice' ? 'Solved in practice. It does not count toward streaks.' : 'Problem completed. It counts toward today’s streak.'}</p>
            )}
            {report && <ReportView key={`${report.mode}-${report.results.map((r) => r.verdict).join()}-${Math.round(report.maxTimeMs)}`} report={report} hasChecker={!!problem.check} />}
            {lang === 'cpp' && <p className="hint-text">C++ runs on a local judge server: start it with <code>npm run judge</code>, or run the whole app with <code>npm run docker</code>.</p>}
            {lang === 'js' && usingInlineRunner() && <p className="hint-text">Note: this environment does not allow background workers, so infinite loops cannot be interrupted.</p>}
          </section>
        </div>
      </div>

      <SubmissionsPanel
        list={submissionsFor(allSubmissions, problem.id)}
        onLoad={(sub) => { setLang(sub.lang); (sub.lang === 'cpp' ? setCppCode : setJsCode)(sub.code); setReport(null); setErrorLines([]); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
      />

      <section className="panel solution">
        <h3 className="smallcaps">Editorial</h3>
        {editorialOpen ? (
          <Rich text={problem.editorial} />
        ) : (
          <div className="row">
            <span className="hint-text">The editorial unlocks once your solution is accepted.</span>
            <button className="btn ghost" onClick={() => { setShowEditorial(true); updateAttempt('code', problem.id, ctx, { revealed: true }); }}>
              Read it now
            </button>
          </div>
        )}
      </section>
    </article>
  );
}

/** 1-based line numbers of the errors in g++ output ("main.cpp:12:5: error: ..."). */
function compilerErrorLines(msg: string): number[] {
  const out = new Set<number>();
  for (const m of msg.matchAll(/main\.cpp:(\d+):\d+: (?:fatal )?error/g)) out.add(Number(m[1]));
  return [...out];
}

const SHOW_LIMIT = 20_000;

function TextBlock({ label, text, preview, wide }: { label: string; text: string; preview?: string; wide?: boolean }) {
  const [full, setFull] = useState(false);
  const [copied, setCopied] = useState(false);
  const long = text.length > (preview?.length ?? 0) && text.length > 400;
  const shown = full ? (text.length > SHOW_LIMIT ? text.slice(0, SHOW_LIMIT) + `\n… (${text.length - SHOW_LIMIT} more characters; use copy to get everything)` : text) : (preview ?? text);
  return (
    <div className={wide ? 'tb-wide' : ''}>
      <div className="sample-label">
        <span>{label}{long && <span className="hint-text"> · {text.length.toLocaleString()} characters, {text.split('\n').length.toLocaleString()} lines</span>}</span>
        <span>
          {long && <button className="linklike" onClick={() => setFull(!full)}>{full ? 'show less' : 'show more'}</button>}{' '}
          <button className="linklike" onClick={() => { navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1200); }).catch(() => {}); }}>{copied ? 'copied' : 'copy'}</button>
        </span>
      </div>
      <pre>{shown.trimEnd() || '(empty)'}</pre>
    </div>
  );
}

function ReportView({ report, hasChecker }: { report: JudgeReport & { mode: 'samples' | 'full' }; hasChecker: boolean }) {
  const failures = report.results.filter((r) => r.verdict !== 'AC');
  const [picked, setPicked] = useState<number | null>(null);
  const label = report.mode === 'samples' ? 'Example' : 'Test';
  const selected = report.results.find((r) => r.index === picked) ?? failures[0];
  const first = failures[0];
  return (
    <div className={`report ${report.verdict === 'AC' ? 'ok' : 'bad'}`}>
      <div className="report-verdict">
        {report.mode === 'samples' && report.verdict === 'AC' ? 'All examples passed' : VERDICT_LABEL[report.verdict]}
        {first && report.verdict !== 'CE' ? ` on ${label.toLowerCase()} ${first.index + 1}` : ''}
        {report.verdict === 'AC' && <span className="report-time"> · max time {Math.round(report.maxTimeMs)} ms</span>}
        {failures.length > 1 && report.verdict !== 'CE' && <span className="report-time"> · {failures.length} of {report.results.length} {label.toLowerCase()}s failed</span>}
      </div>
      {report.verdict !== 'CE' && (
        <div className="test-strip">
          {report.results.map((r) => (
            <button
              key={r.index}
              className={`test-dot ${r.verdict === 'AC' ? 'ok' : 'bad'} ${selected?.index === r.index ? 'sel' : ''}`}
              onClick={() => setPicked(r.index)}
              title={`${label} ${r.index + 1}: ${VERDICT_LABEL[r.verdict]} (${Math.round(r.timeMs)} ms)`}
            >
              {r.index + 1}
            </button>
          ))}
        </div>
      )}
      {selected && selected.verdict !== 'AC' && (
        <div className="failure">
          {report.verdict !== 'CE' && (
            <div className="failure-head">
              {label} {selected.index + 1} · {VERDICT_LABEL[selected.verdict]} · {Math.round(selected.timeMs)} ms
            </div>
          )}
          {selected.message && <pre className="msg">{selected.message}</pre>}
          {selected.verdict !== 'CE' && selected.fullInput !== undefined && (
            <div className="sample-grid three">
              <TextBlock label="Input" text={selected.fullInput} preview={selected.inputPreview} />
              {selected.verdict === 'WA' && <TextBlock label="Your output" text={selected.fullOutput ?? ''} preview={selected.outputPreview} />}
              {selected.verdict === 'WA' && <TextBlock label={hasChecker ? 'One valid answer' : 'Expected'} text={selected.fullExpected ?? ''} preview={selected.expectedPreview} />}
              {selected.verdict === 'RE' && selected.fullOutput && <TextBlock label="Output before the crash" text={selected.fullOutput} />}
            </div>
          )}
        </div>
      )}
      {selected && selected.verdict === 'AC' && <p className="hint-text">{label} {selected.index + 1} passed in {Math.round(selected.timeMs)} ms.</p>}
      {report.mode === 'full' && report.verdict === 'AC' && <p className="feedback ok">Accepted on all {report.results.length} tests.</p>}
    </div>
  );
}

const LANG_LABEL = { js: 'JavaScript', cpp: 'C++20' } as const;

function SubmissionsPanel({ list, onLoad }: { list: Submission[]; onLoad: (s: Submission) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <section className="panel submissions">
      <h3 className="smallcaps">Your submissions{list.length ? ` · ${list.length}` : ''}</h3>
      {list.length === 0 ? (
        <p className="hint-text">Every submission, accepted or not, is saved here with its code. Nothing yet.</p>
      ) : (
        <table className="ledger">
          <thead>
            <tr><th>When</th><th>Language</th><th>Verdict</th><th>Tests</th><th>Time</th><th /></tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <Fragment key={s.id}>
                <tr>
                  <td className="date">{new Date(s.at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                  <td>{LANG_LABEL[s.lang]}</td>
                  <td className={s.verdict === 'AC' ? 'v-ok' : 'v-bad'}>
                    {VERDICT_LABEL[s.verdict]}
                    {s.firstFailed ? <span className="hint-text"> · test {s.firstFailed}</span> : null}
                  </td>
                  <td>{s.verdict === 'CE' ? '–' : `${s.total - s.failed}/${s.total}`}</td>
                  <td>{s.verdict === 'CE' ? '–' : `${Math.round(s.maxTimeMs)} ms`}</td>
                  <td className="sub-actions">
                    <button className="linklike" onClick={() => setOpen(open === s.id ? null : s.id)}>{open === s.id ? 'hide' : 'view'}</button>{' '}
                    <button className="linklike" onClick={() => onLoad(s)}>load</button>
                  </td>
                </tr>
                {open === s.id && (
                  <tr className="sub-code">
                    <td colSpan={6}>
                      {s.message && <pre className="msg">{s.message}</pre>}
                      <pre dangerouslySetInnerHTML={{ __html: highlight(s.code, s.lang) }} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
