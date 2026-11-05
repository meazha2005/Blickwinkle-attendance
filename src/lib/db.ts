import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

export function getDbPool(): mysql.Pool {
  if (!pool) {
    const host = process.env.DB_HOST;
    const port = parseInt(process.env.DB_PORT || "3306", 10);
    const user = process.env.DB_USER;
    const password = process.env.DB_PASS;
    const database = process.env.DB_NAME;

    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    });
  }
  return pool;
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const db = getDbPool();
  const [rows] = await db.query(sql, params);
  return rows as T[];
}

export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  if (!rows || rows.length === 0) return null;
  return rows[0];
}

export async function execute(sql: string, params: any[] = []): Promise<mysql.ResultSetHeader> {
  const db = getDbPool();
  const [result] = await db.execute(sql, params);
  return result as mysql.ResultSetHeader;
}
