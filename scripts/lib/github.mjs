// GitHub data collection.
//
// Every number that ends up on the profile is produced here. Two rules hold
// throughout: never invent a value, and record what a figure actually covers
// so the panels can label it honestly.

const API = 'https://api.github.com';
const MAX_REPOS = 200;      // hard ceiling; anything skipped is reported
const CONCURRENCY = 4;

function headers(token) {
  return {
    Authorization: `bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'mxslr-profile-generator',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function graphql(query, variables, token) {
  const res = await fetch(`${API}/graphql`, {
    method: 'POST',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`GraphQL ${res.status} ${await res.text()}`);
  const json = await res.json();
  if (json.errors) throw new Error(`GraphQL: ${JSON.stringify(json.errors)}`);
  return json.data;
}

/**
 * REST GET with retry. The contributor-stats endpoint answers 202 while
 * GitHub computes the numbers, so a first call frequently has to be repeated.
 */
async function rest(path, token, { retries = 6, wait = 2500 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(`${API}${path}`, { headers: headers(token) });
    if (res.status === 202) {
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    if (res.status === 204 || res.status === 404 || res.status === 403) return null;
    if (!res.ok) throw new Error(`REST ${res.status} ${path}`);
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }
  return null;
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      try {
        out[i] = await fn(items[i], i);
      } catch (err) {
        console.warn(`  skipped ${items[i]?.nameWithOwner ?? i}: ${err.message}`);
        out[i] = null;
      }
    }
  });
  await Promise.all(workers);
  return out;
}

const REPOS_QUERY = `
query($login:String!,$cursor:String){
  user(login:$login){
    createdAt
    followers{totalCount}
    following{totalCount}
    repositories(ownerAffiliations:OWNER,isFork:false,first:100,after:$cursor,orderBy:{field:PUSHED_AT,direction:DESC}){
      totalCount
      pageInfo{hasNextPage endCursor}
      nodes{
        name
        nameWithOwner
        isPrivate
        stargazerCount
        languages(first:12,orderBy:{field:SIZE,direction:DESC}){edges{size node{name}}}
      }
    }
  }
}`;

const YEAR_QUERY = `
query($login:String!,$from:DateTime!,$to:DateTime!){
  user(login:$login){
    contributionsCollection(from:$from,to:$to){
      totalCommitContributions
      restrictedContributionsCount
      totalPullRequestContributions
      totalIssueContributions
      totalPullRequestReviewContributions
      contributionCalendar{
        totalContributions
        weeks{contributionDays{date contributionCount weekday}}
      }
    }
  }
}`;

const WEEKDAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

function iso(d) {
  return d.toISOString().slice(0, 10);
}

function addDays(d, n) {
  const c = new Date(d.getTime());
  c.setUTCDate(c.getUTCDate() + n);
  return c;
}

function ageLabel(from, to) {
  let years = to.getUTCFullYear() - from.getUTCFullYear();
  let months = to.getUTCMonth() - from.getUTCMonth();
  if (to.getUTCDate() < from.getUTCDate()) months -= 1;
  if (months < 0) { years -= 1; months += 12; }
  return years > 0 ? `${years}Y ${months}M` : `${months}M`;
}

export async function collect(login, token, now = new Date()) {
  // ---- repositories, stars and language bytes ---------------------------
  let cursor = null;
  let repoNodes = [];
  let base = null;
  do {
    const data = await graphql(REPOS_QUERY, { login, cursor }, token);
    base = base || data.user;
    repoNodes = repoNodes.concat(data.user.repositories.nodes);
    cursor = data.user.repositories.pageInfo.hasNextPage ? data.user.repositories.pageInfo.endCursor : null;
  } while (cursor && repoNodes.length < MAX_REPOS);

  const repoTotal = base.repositories.totalCount;
  const scanned = repoNodes.slice(0, MAX_REPOS);
  console.log(`repositories: ${scanned.length} scanned of ${repoTotal} owned`);
  if (scanned.length < repoTotal) {
    console.warn(`  note: ${repoTotal - scanned.length} repositories beyond the ${MAX_REPOS} cap are not counted`);
  }

  const stars = scanned.reduce((s, r) => s + r.stargazerCount, 0);
  const langBytes = new Map();
  for (const r of scanned) {
    for (const e of r.languages.edges) {
      langBytes.set(e.node.name, (langBytes.get(e.node.name) || 0) + e.size);
    }
  }
  const languageBytes = [...langBytes.values()].reduce((a, b) => a + b, 0);
  const languages = [...langBytes.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, bytes]) => ({ name, bytes, pct: languageBytes ? (bytes / languageBytes) * 100 : 0 }));

  // ---- lines of code ----------------------------------------------------
  // Per-repo contributor statistics, filtered to this account. GitHub only
  // reports this for repositories the token can read, so the total is a
  // floor rather than a universal count.
  let linesAdded = 0;
  let linesRemoved = 0;
  let locRepos = 0;
  const results = await mapLimit(scanned, CONCURRENCY, async (repo) => {
    const stats = await rest(`/repos/${repo.nameWithOwner}/stats/contributors`, token);
    if (!Array.isArray(stats)) return null;
    const mine = stats.find((s) => s?.author?.login?.toLowerCase() === login.toLowerCase());
    if (!mine) return null;
    let a = 0;
    let d = 0;
    for (const w of mine.weeks) { a += w.a; d += w.d; }
    return { a, d };
  });
  for (const r of results) {
    if (!r) continue;
    linesAdded += r.a;
    linesRemoved += r.d;
    locRepos++;
  }
  console.log(`lines of code: +${linesAdded} / -${linesRemoved} across ${locRepos} repositories`);

  // ---- contributions, year by year --------------------------------------
  const created = new Date(base.createdAt);
  const startYear = created.getUTCFullYear();
  const endYear = now.getUTCFullYear();

  let totalCommits = 0;
  let restricted = 0;
  let prs = 0;
  let issues = 0;
  let reviews = 0;
  const daily = new Map();

  for (let year = startYear; year <= endYear; year++) {
    const from = new Date(Date.UTC(year, 0, 1));
    const to = new Date(Date.UTC(year, 11, 31, 23, 59, 59));
    const data = await graphql(YEAR_QUERY, {
      login,
      from: (from < created ? created : from).toISOString(),
      to: (to > now ? now : to).toISOString(),
    }, token);
    const c = data.user.contributionsCollection;
    // Commits only. restrictedContributionsCount is deliberately NOT added
    // here: it counts every contribution type the viewer cannot see, so
    // folding it in would report hidden issues and pull requests as commits.
    // With the profile setting enabled and a repo-scoped token, private
    // commits already land in totalCommitContributions.
    totalCommits += c.totalCommitContributions;
    restricted += c.restrictedContributionsCount;
    prs += c.totalPullRequestContributions;
    issues += c.totalIssueContributions;
    reviews += c.totalPullRequestReviewContributions;
    for (const w of c.contributionCalendar.weeks) {
      for (const d of w.contributionDays) {
        daily.set(d.date, (daily.get(d.date) || 0) + d.contributionCount);
      }
    }
  }

  // ---- derived series ---------------------------------------------------
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  let contributions12m = 0;
  for (let i = 0; i < 365; i++) contributions12m += daily.get(iso(addDays(today, -i))) || 0;

  const weeks = [];
  for (let i = 51; i >= 0; i--) {
    const start = addDays(today, -(i * 7 + 6));
    let total = 0;
    for (let d = 0; d < 7; d++) total += daily.get(iso(addDays(start, d))) || 0;
    weeks.push({ date: iso(start), total });
  }

  // Current streak walks back from today. A quiet today does not break it,
  // because the day is not over yet.
  let currentStreak = 0;
  let probe = (daily.get(iso(today)) || 0) > 0 ? today : addDays(today, -1);
  while ((daily.get(iso(probe)) || 0) > 0) {
    currentStreak++;
    probe = addDays(probe, -1);
  }

  const dates = [...daily.keys()].filter((d) => (daily.get(d) || 0) > 0).sort();
  let longestStreak = 0;
  let run = 0;
  let prev = null;
  for (const d of dates) {
    run = prev && iso(addDays(new Date(prev + 'T00:00:00Z'), 1)) === d ? run + 1 : 1;
    if (run > longestStreak) longestStreak = run;
    prev = d;
  }

  const byWeekday = new Array(7).fill(0);
  for (const [date, count] of daily) {
    byWeekday[new Date(date + 'T00:00:00Z').getUTCDay()] += count;
  }
  const busiestWeekday = WEEKDAYS[byWeekday.indexOf(Math.max(...byWeekday))];

  return {
    ok: true,
    synced: iso(now),
    login,
    totalCommits,
    // Contributions of any type still hidden from this token. Kept in the
    // cache so the commit figure can be audited, not shown on a panel.
    restrictedContributions: restricted,
    contributions12m,
    linesAdded,
    linesRemoved,
    linesNet: linesAdded - linesRemoved,
    repos: repoTotal,
    reposScanned: scanned.length,
    locRepos,
    stars,
    prs,
    issues,
    reviews,
    followers: base.followers.totalCount,
    following: base.following.totalCount,
    currentStreak,
    longestStreak,
    busiestWeekday,
    accountAge: ageLabel(created, now),
    createdAt: base.createdAt,
    languageBytes,
    languages,
    weeks,
  };
}
