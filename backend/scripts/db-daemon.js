const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const pgBinDir = path.resolve(__dirname, '../pgsql/bin');
const pgDataDir = path.resolve(__dirname, '../.pgdata');
const postgresExe = path.join(pgBinDir, 'postgres.exe');
const initdbExe = path.join(pgBinDir, 'initdb.exe');
const createdbExe = path.join(pgBinDir, 'createdb.exe');
const pgctlExe = path.join(pgBinDir, 'pg_ctl.exe');

function startPostgres() {
  if (!fs.existsSync(pgDataDir)) {
    console.log('Initializing Postgres cluster in', pgDataDir);
    execSync(`"${initdbExe}" -D "${pgDataDir}" -U postgres -A trust -E UTF8`, { stdio: 'inherit' });
  }

  // Check if already running
  try {
    const status = execSync(`"${pgctlExe}" -D "${pgDataDir}" status`, { encoding: 'utf8' });
    if (status.includes('server is running')) {
      console.log('Postgres is already running.');
      ensureDatabase();
      return;
    }
  } catch (e) {
    // Not running, continue to start
  }

  console.log('Starting Postgres daemon...');
  const child = spawn(postgresExe, ['-D', pgDataDir], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();

  // Wait for it to be ready
  let retries = 15;
  const interval = setInterval(() => {
    try {
      const status = execSync(`"${pgctlExe}" -D "${pgDataDir}" status`, { encoding: 'utf8' });
      if (status.includes('server is running')) {
        clearInterval(interval);
        console.log('Postgres daemon started successfully on port 5432.');
        ensureDatabase();
      }
    } catch (err) {
      retries--;
      if (retries <= 0) {
        clearInterval(interval);
        console.error('Timed out waiting for Postgres to start.');
      }
    }
  }, 1000);
}

function ensureDatabase() {
  try {
    execSync(`"${createdbExe}" -U postgres -h 127.0.0.1 mahmas_language`, { stdio: 'pipe' });
    console.log('Created database mahmas_language');
  } catch (err) {
    // If it already exists, that's expected
    console.log('Database mahmas_language ready.');
  }
}

startPostgres();
