const state = {
  headers: [],
  rows: [],
  metricTypes: new Map(),
};

const elements = {
  dataInput: document.getElementById('dataInput'),
  parseFeedback: document.getElementById('parseFeedback'),
  dataPreview: document.getElementById('dataPreview'),
  clearData: document.getElementById('clearData'),
  groupColumn: document.getElementById('groupColumn'),
  denominatorColumn: document.getElementById('denominatorColumn'),
  proportionMetrics: document.getElementById('proportionMetrics'),
  meanMetrics: document.getElementById('meanMetrics'),
  metricTypeConfig: document.getElementById('metricTypeConfig'),
  runProportion: document.getElementById('runProportion'),
  proportionResults: document.getElementById('proportionResults'),
  runMeanTest: document.getElementById('runMeanTest'),
  meanResults: document.getElementById('meanResults'),
  alphaInput: document.getElementById('alphaInput'),
};

function parseDelimitedLine(line, delimiter) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (!inQuotes && char === delimiter) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function detectDelimiter(line) {
  if (line.includes('\t')) return '\t';
  if (line.includes(';')) return ';';
  if (line.includes(',')) return ',';
  return '\t';
}

function parseTableData(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (!lines.length) {
    return { headers: [], rows: [], ignored: 0 };
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = parseDelimitedLine(lines[0], delimiter);
  const rows = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cells = parseDelimitedLine(lines[i], delimiter);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? '';
    });
    rows.push(row);
  }

  return { headers, rows, ignored: 0 };
}

function createOption(value) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = value;
  return option;
}

function clearSelect(select) {
  while (select.options.length) {
    select.remove(0);
  }
}

function updateSelectors() {
  const { headers } = state;
  const selects = [elements.groupColumn, elements.denominatorColumn, elements.proportionMetrics, elements.meanMetrics];
  selects.forEach((select) => clearSelect(select));

  headers.forEach((header) => {
    if (elements.groupColumn) elements.groupColumn.appendChild(createOption(header));
    if (elements.denominatorColumn) elements.denominatorColumn.appendChild(createOption(header));
    if (elements.proportionMetrics) elements.proportionMetrics.appendChild(createOption(header));
    if (elements.meanMetrics) elements.meanMetrics.appendChild(createOption(header));
  });

  elements.groupColumn.disabled = headers.length === 0;
  elements.denominatorColumn.disabled = headers.length === 0;
  elements.proportionMetrics.disabled = headers.length === 0;
  elements.meanMetrics.disabled = headers.length === 0;
  elements.runProportion.disabled = headers.length === 0;
  elements.runMeanTest.disabled = headers.length === 0;
}

function renderPreview() {
  const container = elements.dataPreview;
  container.innerHTML = '';
  if (!state.rows.length) {
    container.classList.add('hidden');
    return;
  }

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  state.headers.forEach((header) => {
    const th = document.createElement('th');
    th.textContent = header;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  const tbody = document.createElement('tbody');
  state.rows.slice(0, 20).forEach((row) => {
    const tr = document.createElement('tr');
    state.headers.forEach((header) => {
      const td = document.createElement('td');
      td.textContent = row[header] ?? '';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
  container.appendChild(table);
  container.classList.remove('hidden');
}

function handleDataChange() {
  const text = elements.dataInput.value;
  const { headers, rows } = parseTableData(text);
  state.headers = headers;
  state.rows = rows;
  state.metricTypes.clear();

  if (!headers.length) {
    elements.parseFeedback.textContent = '等待数据...';
    elements.dataPreview.classList.add('hidden');
  } else {
    elements.parseFeedback.textContent = `已载入 ${rows.length} 行数据，检测到 ${headers.length} 列。`;
  }
  elements.parseFeedback.classList.remove('error');

  updateSelectors();
  renderPreview();
  rebuildMetricConfig();
  clearResults();
}

function clearResults() {
  elements.proportionResults.innerHTML = '';
  elements.meanResults.innerHTML = '';
}

function handleClear() {
  elements.dataInput.value = '';
  elements.parseFeedback.textContent = '数据已清空';
  elements.parseFeedback.classList.remove('error');
  state.headers = [];
  state.rows = [];
  state.metricTypes.clear();
  updateSelectors();
  renderPreview();
  rebuildMetricConfig();
  clearResults();
}

function getSelectedOptions(select) {
  return Array.from(select.selectedOptions).map((option) => option.value);
}

function rebuildMetricConfig() {
  const container = elements.metricTypeConfig;
  container.innerHTML = '';
  const metrics = getSelectedOptions(elements.proportionMetrics);
  if (!metrics.length) {
    container.classList.add('hidden');
    return;
  }

  container.classList.remove('hidden');
  metrics.forEach((metric) => {
    if (!state.metricTypes.has(metric)) {
      state.metricTypes.set(metric, 'auto');
    }
    const wrapper = document.createElement('div');
    wrapper.className = 'metric-item';
    const title = document.createElement('h3');
    title.textContent = metric;
    const radioGroup = document.createElement('div');
    radioGroup.className = 'radio-group';

    ['auto', 'count', 'rate'].forEach((type) => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = `metric-type-${metric}`;
      input.value = type;
      input.checked = state.metricTypes.get(metric) === type;
      input.addEventListener('change', () => {
        state.metricTypes.set(metric, type);
      });
      label.appendChild(input);
      const span = document.createElement('span');
      span.textContent =
        type === 'auto'
          ? '自动识别（≤1 或 ≤100 视为比例/百分比）'
          : type === 'count'
          ? '人数/事件次数'
          : '比例/百分比';
      label.appendChild(span);
      radioGroup.appendChild(label);
    });

    wrapper.appendChild(title);
    wrapper.appendChild(radioGroup);
    container.appendChild(wrapper);
  });
}

function parseNumber(value) {
  if (value === undefined || value === null) return null;
  const normalized = String(value).replace(/%/g, '').trim();
  if (!normalized) return null;
  const number = Number(normalized.replace(/,/g, ''));
  return Number.isFinite(number) ? number : null;
}

function resolveMetricNumerator(value, denominator, type) {
  if (!Number.isFinite(denominator) || denominator <= 0) {
    return { numerator: null };
  }
  if (!Number.isFinite(value)) {
    return { numerator: null };
  }

  const strategy = type || 'auto';

  if (strategy === 'count') {
    if (value < 0) return { numerator: null };
    return { numerator: value, usedDenominator: denominator };
  }

  if (strategy === 'rate') {
    let rate = value;
    if (rate > 1) rate /= 100;
    if (rate < 0 || rate > 1) return { numerator: null };
    return { numerator: rate * denominator, usedDenominator: denominator };
  }

  // auto
  if (value >= 0 && value <= 1) {
    return { numerator: value * denominator, usedDenominator: denominator };
  }
  if (value > 1 && value <= 100) {
    return { numerator: (value / 100) * denominator, usedDenominator: denominator };
  }
  if (value >= 0) {
    return { numerator: value, usedDenominator: denominator };
  }
  return { numerator: null };
}

function aggregateProportionData(metric, type, groupColumn, denominatorColumn) {
  const summary = new Map();
  let ignored = 0;
  state.rows.forEach((row) => {
    const group = row[groupColumn];
    const denominatorValue = parseNumber(row[denominatorColumn]);
    const metricValue = parseNumber(row[metric]);
    if (!group || !Number.isFinite(denominatorValue) || denominatorValue <= 0 || !Number.isFinite(metricValue)) {
      ignored += 1;
      return;
    }
    const { numerator, usedDenominator } = resolveMetricNumerator(metricValue, denominatorValue, type);
    if (!Number.isFinite(numerator) || numerator < 0 || !Number.isFinite(usedDenominator) || usedDenominator <= 0) {
      ignored += 1;
      return;
    }
    if (!summary.has(group)) {
      summary.set(group, { numerator: 0, denominator: 0, rows: 0 });
    }
    const record = summary.get(group);
    record.numerator += numerator;
    record.denominator += usedDenominator;
    record.rows += 1;
  });
  return { summary, ignored };
}

function erf(x) {
  const sign = x >= 0 ? 1 : -1;
  const absX = Math.abs(x);
  const t = 1 / (1 + 0.5 * absX);
  const tau =
    t * Math.exp(
      -absX * absX -
        1.26551223 +
        1.00002368 * t +
        0.37409196 * t * t +
        0.09678418 * t ** 3 -
        0.18628806 * t ** 4 +
        0.27886807 * t ** 5 -
        1.13520398 * t ** 6 +
        1.48851587 * t ** 7 -
        0.82215223 * t ** 8 +
        0.17087277 * t ** 9
    );
  return sign * (1 - tau);
}

function normalCDF(z) {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

function inverseNormalCDF(p) {
  if (p <= 0 || p >= 1) return NaN;
  const a = [
    -39.69683028665376,
    220.9460984245205,
    -275.9285104469687,
    138.3577518672690,
    -30.66479806614716,
    2.506628277459239
  ];
  const b = [
    -54.47609879822406,
    161.5858368580409,
    -155.6989798598866,
    66.80131188771972,
    -13.28068155288572
  ];
  const c = [
    -0.007784894002430293,
    -0.3223964580411365,
    -2.400758277161838,
    -2.549732539343734,
    4.374664141464968,
    2.938163982698783
  ];
  const d = [
    0.007784695709041462,
    0.3224671290700398,
    2.445134137142996,
    3.754408661907416
  ];

  const plow = 0.02425;
  const phigh = 1 - plow;
  let q;
  let r;

  if (p < plow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
  if (phigh < p) {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return (
      -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }

  q = p - 0.5;
  r = q * q;
  return (
    (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
  );
}

function logGamma(z) {
  const g = 7;
  const coefficients = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.3234287776531,
    -176.6150291621406,
    12.507343278686905,
    -0.13857109526572012,
    0.000009984369578019571,
    0.00000015056327351493116
  ];

  if (z < 0.5) {
    return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
  }

  z -= 1;
  let x = coefficients[0];
  for (let i = 1; i < coefficients.length; i += 1) {
    x += coefficients[i] / (z + i);
  }
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function betacf(x, a, b) {
  const MAX_ITER = 200;
  const EPS = 3e-7;
  const FPMIN = 1e-30;
  let qab = a + b;
  let qap = a + 1;
  let qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= MAX_ITER; m += 1) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;

    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1.0) < EPS) {
      break;
    }
  }
  return h;
}

function regularizedIncompleteBeta(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betacf(x, a, b)) / a;
  }
  return 1 - (bt * betacf(1 - x, b, a)) / b;
}

function studentTCDF(t, df) {
  if (!Number.isFinite(t) || !Number.isFinite(df) || df <= 0) {
    return NaN;
  }
  const x = df / (df + t * t);
  const ib = regularizedIncompleteBeta(x, df / 2, 0.5);
  if (t >= 0) {
    return 1 - 0.5 * ib;
  }
  return 0.5 * ib;
}

function formatNumber(value, digits = 4) {
  if (!Number.isFinite(value)) return '—';
  return Number(value).toFixed(digits);
}

function formatPercent(value, digits = 2) {
  if (!Number.isFinite(value)) return '—';
  return `${(value * 100).toFixed(digits)}%`;
}

function renderBadge(text, type) {
  const span = document.createElement('span');
  span.className = `badge ${type}`;
  span.textContent = text;
  return span;
}

function renderProportionResults(results, alpha, ignored) {
  const container = elements.proportionResults;
  container.innerHTML = '';
  if (!results.length) {
    container.textContent = '请选择至少一个指标，并确保存在两个不同的分组。';
    return;
  }

  const table = document.createElement('table');
  table.className = 'result-table';
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th>指标</th>
      <th>组 1 成功数/样本</th>
      <th>组 1 转化率</th>
      <th>组 2 成功数/样本</th>
      <th>组 2 转化率</th>
      <th>差值</th>
      <th>z</th>
      <th>p 值</th>
      <th>显著性</th>
    </tr>`;
  table.appendChild(thead);
  const tbody = document.createElement('tbody');

  results.forEach((result) => {
    const tr = document.createElement('tr');
    const group1Cell = `<strong>${result.groups[0].name}</strong><br>${formatNumber(result.groups[0].numerator, 2)} / ${formatNumber(result.groups[0].denominator, 2)}`;
    const group2Cell = `<strong>${result.groups[1].name}</strong><br>${formatNumber(result.groups[1].numerator, 2)} / ${formatNumber(result.groups[1].denominator, 2)}`;
    tr.innerHTML = `
      <td>${result.metric}</td>
      <td>${group1Cell}</td>
      <td>${formatPercent(result.groups[0].rate)}</td>
      <td>${group2Cell}</td>
      <td>${formatPercent(result.groups[1].rate)}</td>
      <td>${formatPercent(result.diff)}</td>
      <td>${formatNumber(result.zScore, 3)}</td>
      <td>${formatNumber(result.pValue, 4)}</td>
      <td></td>`;
    const badgeCell = tr.lastElementChild;
    const significant = Number.isFinite(result.pValue) && result.pValue < alpha;
    if (!Number.isFinite(result.pValue)) {
      badgeCell.appendChild(renderBadge('数据不足', 'neutral'));
    } else if (significant) {
      badgeCell.appendChild(renderBadge(`显著 (α=${alpha})`, 'success'));
    } else {
      badgeCell.appendChild(renderBadge('不显著', 'neutral'));
    }
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.appendChild(table);
  const summary = document.createElement('div');
  summary.className = 'summary';
  summary.textContent = `忽略 ${ignored} 行数据（缺少分组/样本量/指标数值）。已按字母排序选取前两个分组进行比较。`;
  container.appendChild(summary);
}

function renderMeanResults(results, alpha, ignored) {
  const container = elements.meanResults;
  container.innerHTML = '';
  if (!results.length) {
    container.textContent = '请选择至少一个指标，并确保存在两个分组且每组均有有效数据。';
    return;
  }

  const table = document.createElement('table');
  table.className = 'result-table';
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th>指标</th>
      <th>组 1 均值 (n)</th>
      <th>组 2 均值 (n)</th>
      <th>差值</th>
      <th>t</th>
      <th>自由度</th>
      <th>p 值</th>
      <th>显著性</th>
    </tr>`;
  table.appendChild(thead);
  const tbody = document.createElement('tbody');

  results.forEach((result) => {
    const tr = document.createElement('tr');
    const g1 = result.groups[0];
    const g2 = result.groups[1];
    tr.innerHTML = `
      <td>${result.metric}</td>
      <td><strong>${g1.name}</strong><br>${formatNumber(g1.mean, 4)} (n=${g1.n})</td>
      <td><strong>${g2.name}</strong><br>${formatNumber(g2.mean, 4)} (n=${g2.n})</td>
      <td>${formatNumber(result.diff, 4)}</td>
      <td>${formatNumber(result.tScore, 4)}</td>
      <td>${formatNumber(result.df, 2)}</td>
      <td>${formatNumber(result.pValue, 4)}</td>
      <td></td>`;
    const badgeCell = tr.lastElementChild;
    const significant = Number.isFinite(result.pValue) && result.pValue < alpha;
    if (!Number.isFinite(result.pValue)) {
      badgeCell.appendChild(renderBadge('数据不足', 'neutral'));
    } else if (significant) {
      badgeCell.appendChild(renderBadge(`显著 (α=${alpha})`, 'success'));
    } else {
      badgeCell.appendChild(renderBadge('不显著', 'neutral'));
    }
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.appendChild(table);
  const summary = document.createElement('div');
  summary.className = 'summary';
  summary.textContent = `忽略 ${ignored} 条数据（缺少分组或指标数值）。已按字母排序选取前两个分组进行比较。`;
  container.appendChild(summary);
}

function runProportionTests() {
  const metrics = getSelectedOptions(elements.proportionMetrics);
  const groupColumn = elements.groupColumn.value;
  const denominatorColumn = elements.denominatorColumn.value;
  const alpha = Number(elements.alphaInput.value) || 0.05;

  if (!metrics.length || !groupColumn || !denominatorColumn) {
    elements.proportionResults.textContent = '请先完成列映射并选择指标。';
    return;
  }

  const results = [];
  let ignoredTotal = 0;

  metrics.forEach((metric) => {
    const type = state.metricTypes.get(metric) || 'auto';
    const { summary, ignored } = aggregateProportionData(metric, type, groupColumn, denominatorColumn);
    ignoredTotal += ignored;
    const groups = Array.from(summary.entries()).map(([name, value]) => ({
      name,
      numerator: value.numerator,
      denominator: value.denominator,
      rate: value.denominator > 0 ? value.numerator / value.denominator : NaN,
      rows: value.rows,
    }));
    if (groups.length < 2) {
      return;
    }
    groups.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    const [g1, g2] = groups;
    const pooled = g1.numerator + g2.numerator;
    const pooledDen = g1.denominator + g2.denominator;
    const p1 = g1.rate;
    const p2 = g2.rate;
    const pooledRate = pooledDen > 0 ? pooled / pooledDen : NaN;
    const se = Number.isFinite(pooledRate)
      ? Math.sqrt(pooledRate * (1 - pooledRate) * (1 / g1.denominator + 1 / g2.denominator))
      : NaN;
    const diff = Number.isFinite(p1) && Number.isFinite(p2) ? p1 - p2 : NaN;
    const zScore = Number.isFinite(diff) && Number.isFinite(se) && se !== 0 ? diff / se : NaN;
    const pValue = Number.isFinite(zScore) ? 2 * (1 - normalCDF(Math.abs(zScore))) : NaN;

    results.push({
      metric,
      groups: [g1, g2],
      diff,
      zScore,
      pValue,
    });
  });

  renderProportionResults(results, alpha, ignoredTotal);
}

function calculateGroupStats(metric, groupColumn) {
  const grouped = new Map();
  let ignored = 0;
  state.rows.forEach((row) => {
    const group = row[groupColumn];
    const value = parseNumber(row[metric]);
    if (!group || !Number.isFinite(value)) {
      ignored += 1;
      return;
    }
    if (!grouped.has(group)) {
      grouped.set(group, []);
    }
    grouped.get(group).push(value);
  });
  return { grouped, ignored };
}

function computeWelchT(values1, values2) {
  const n1 = values1.length;
  const n2 = values2.length;
  if (n1 < 2 || n2 < 2) {
    return { tScore: NaN, df: NaN, pValue: NaN, mean1: NaN, mean2: NaN };
  }
  const mean1 = values1.reduce((sum, val) => sum + val, 0) / n1;
  const mean2 = values2.reduce((sum, val) => sum + val, 0) / n2;
  const var1 = values1.reduce((sum, val) => sum + (val - mean1) ** 2, 0) / (n1 - 1);
  const var2 = values2.reduce((sum, val) => sum + (val - mean2) ** 2, 0) / (n2 - 1);
  const se = Math.sqrt(var1 / n1 + var2 / n2);
  if (!Number.isFinite(se) || se === 0) {
    return { tScore: NaN, df: NaN, pValue: NaN, mean1, mean2 };
  }
  const tScore = (mean1 - mean2) / se;
  const dfNumerator = (var1 / n1 + var2 / n2) ** 2;
  const dfDenominator = (var1 ** 2) / (n1 ** 2 * (n1 - 1)) + (var2 ** 2) / (n2 ** 2 * (n2 - 1));
  const df = dfDenominator === 0 ? NaN : dfNumerator / dfDenominator;
  const pValue = Number.isFinite(df)
    ? 2 * (1 - studentTCDF(Math.abs(tScore), df))
    : NaN;
  return { tScore, df, pValue, mean1, mean2, var1, var2 };
}

function runMeanTests() {
  const metrics = getSelectedOptions(elements.meanMetrics);
  const groupColumn = elements.groupColumn.value;
  const alpha = Number(elements.alphaInput.value) || 0.05;
  if (!metrics.length || !groupColumn) {
    elements.meanResults.textContent = '请先选择分组列和指标列。';
    return;
  }

  const results = [];
  let ignoredTotal = 0;

  metrics.forEach((metric) => {
    const { grouped, ignored } = calculateGroupStats(metric, groupColumn);
    ignoredTotal += ignored;
    const groups = Array.from(grouped.entries()).map(([name, values]) => ({ name, values }));
    if (groups.length < 2) {
      return;
    }
    groups.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    const [g1, g2] = groups;
    const stats = computeWelchT(g1.values, g2.values);
    results.push({
      metric,
      groups: [
        { name: g1.name, mean: stats.mean1, n: g1.values.length },
        { name: g2.name, mean: stats.mean2, n: g2.values.length },
      ],
      diff: stats.mean1 - stats.mean2,
      tScore: stats.tScore,
      df: stats.df,
      pValue: stats.pValue,
    });
  });

  renderMeanResults(results, alpha, ignoredTotal);
}

function init() {
  handleDataChange();
  elements.dataInput.addEventListener('input', handleDataChange);
  elements.clearData.addEventListener('click', handleClear);
  elements.proportionMetrics.addEventListener('change', rebuildMetricConfig);
  elements.runProportion.addEventListener('click', runProportionTests);
  elements.runMeanTest.addEventListener('click', runMeanTests);
}

init();
