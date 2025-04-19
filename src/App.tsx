import React, { useRef } from 'react';
import './style.css';
import data from './assets/model_results.json';

const EPS_RATIO = 0.02;

const CLS = {
  body: 'rep-body',
  h1: 'rep-title',
  section: 'rep-section',
  table: 'rep-table',
  caption: 'rep-caption',
  thead: 'rep-thead',
  tbodyEven: 'rep-row-even',
  img: 'rep-img',
} as const;

interface Model {
  degree: number;
  coef: number[];
  var: number;
  sd: number;
  code: string;
  comment?: string;
}

interface OperationInfo {
  models: Model[];
  image: string;              // имя файла‑графика в assets
}

type ReportData = Record<string, OperationInfo>;

function fmt(x: number): string {
  return Math.abs(x) < 1e-12 ? '0' : x.toFixed(6).replace(/\.?0+$/, '');
}

function explain(code: string): string {
  const p: string[] = [];
  if (code.startsWith('*')) {
    p.push('старший коэффициент < 0');
    code = code.slice(1);
  }
  p.push(code[0] === '+' ? 'значимо лучше при α=0.05' : 'не лучше при α=0.05');
  p.push(code[1] === '+' ? 'значимо лучше при α=0.01' : 'не лучше при α=0.01');
  return p.join(', ');
}

const Intro: React.FC = () => (
  <>
    <section className={CLS.section}>
      <h2>Как работает полиномиальная регрессия</h2>
      <p>
        Время <em>y</em> аппроксимируется полиномом степени&nbsp;<em>k</em> от&nbsp;размера
        данных <em>n</em>:
      </p>
      <p>
        <code>
          y = a<sub>0</sub> + a<sub>1</sub>n + … + a<sub>k</sub>n<sup>k</sup>
        </code>
        .
      </p>
      <p>
        Коэффициенты <code>a_i</code> находятся методом{' '}
        <abbr title="Ordinary Least Squares – метод наименьших квадратов">OLS</abbr>,
        минимизирующим сумму квадратов <em>остатков</em> <code>resid</code>. F‑тест проверяет,
        улучшает&nbsp;ли добавление нового члена точность модели.
      </p>
      <p>
        Если относительный вес старшего коэффициента |a<sub>k</sub>| / max
        <sub>i&lt;k</sub>|a<sub>i</sub>| &lt;&nbsp;{(EPS_RATIO * 100).toFixed(0)} %, член
        считается <em>фиктивным</em> и отмечается в таблицах.
      </p>
    </section>

    <section className={CLS.section}>
      <h2>Справочник терминов</h2>
      <ul>
        <li>
          <b>Residual (resid)</b> — разница между фактом и прогнозом.
        </li>
        <li>
          <b>RSS</b> — сумма квадратов resid.
        </li>
        <li>
          <b>σ²</b> (D[X]) — оценка дисперсии: RSS / (N − k − 1).
        </li>
        <li>
          <b>СКО</b> — стандартное отклонение = √σ².
        </li>
        <li>
          <b>F‑тест</b> — проверка статистической значимости нового члена.
        </li>
      </ul>
    </section>
  </>
);

const RegressionReport: React.FC = () => {
  const reportData = data as ReportData;

  const reportRef = useRef<HTMLDivElement>(null);

  const downloadPdf = async () => {
    const el  = reportRef.current!;              // <div> с отчётом
    const opt = {
      margin:      [10, 10, 10, 10],             // мм
      filename:    'regression.pdf',
      image:       { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 1,
        width: el.scrollWidth,                   // ключ к правильному масштабу
      },
      jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: {
        mode: ['avoid-all', 'css'],              // запрет разрывов внутри любого узла
        avoid: ['.rep-table', '.rep-img'],       // …и особенно таблиц и картинок
      },
    } as const;

    import('html2pdf.js').then(pdf => pdf.default().set(opt).from(el).save());
  };

  return (
    <>
      <button onClick={downloadPdf}>Download PDF</button>
      <div className={CLS.body} ref={reportRef}>
        <h1 className={CLS.h1}>Отчёт регрессионного анализа</h1>
  
        <Intro />
  
        {Object.entries(reportData).map(([op, { models, image }]) => (
          <React.Fragment key={op}>
            <div className={CLS.caption}>Операция: {op}</div>
  
            <table className={CLS.table}>
              <thead className={CLS.thead}>
                <tr>
                  <th>deg</th>
                  <th>a0</th>
                  <th>a1</th>
                  <th>a2</th>
                  <th>a3</th>
                  <th>a4</th>
                  <th>D[X]</th>
                  <th>СКО</th>
                  <th>Код</th>
                  <th>Пояснение</th>
                  <th>Комментарий</th>
                </tr>
              </thead>
  
              <tbody>
                {models.map((m, idx) => (
                  <tr key={idx} className={idx % 2 ? CLS.tbodyEven : undefined}>
                    <td>{m.degree}</td>
                    {m.coef.map((c, i) => (
                      <td key={i}>{fmt(c)}</td>
                    ))}
                    <td>{fmt(m.var)}</td>
                    <td>{fmt(m.sd)}</td>
                    <td>{m.code}</td>
                    <td>{explain(m.code)}</td>
                    <td>{m.comment || '\u00A0'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
  
            <p style={{
              width: "70%",
              margin: '0 auto'
            }}>
              <img
                className={CLS.img}
                src={new URL(`./assets/${image}`, import.meta.url).href}
                alt={`график ${op}`}
              />
            </p>
          </React.Fragment>
        ))}
      </div>
    </>
  );
};

export default RegressionReport;
