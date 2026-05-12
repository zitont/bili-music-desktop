import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

let db;

/**
 * 读取安装目录下的自定义数据目录配置
 * @returns {string|null} 自定义数据目录路径，未配置时返回 null
 */
function getCustomDataDir() {
  try {
    const configPath = app.isPackaged
      ? path.join(path.dirname(process.execPath), 'data-dir.cfg')
      : path.join(__dirname, 'data-dir.cfg');
    if (fs.existsSync(configPath)) {
      const dir = fs.readFileSync(configPath, 'utf-8').trim();
      if (dir && fs.existsSync(dir)) {
        return dir;
      }
    }
  } catch {
    // 配置文件读取失败，使用默认路径
  }
  return null;
}

/**
 * 获取数据库文件路径
 * 优先使用自定义数据目录，其次使用默认路径
 */
function getDbPath() {
  const customDir = getCustomDataDir();
  if (customDir) {
    return path.join(customDir, 'bilibili.db');
  }
  if (app.isPackaged) {
    return path.join(app.getPath('userData'), 'data', 'bilibili.db');
  }
  return path.join(__dirname, 'data', 'bilibili.db');
}

/**
 * 检查并确保所有表已创建
 */
function ensureTables() {
  const requiredTables = ['video_lists', 'video', 'videolist_videos'];
  const existingTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name);
  const missingTables = requiredTables.filter(t => !existingTables.includes(t));
  if (missingTables.length > 0) {
    console.warn('数据库缺少表:', missingTables, '，重新创建');
    createTables();
  } else {
    // 迁移：为 video_lists 表添加新字段
    migrateVideoListsTable();
    const defaultPlaylist = db.prepare('SELECT * FROM video_lists WHERE videolists_id = 1').get();
    if (!defaultPlaylist) {
      db.prepare('INSERT INTO video_lists (videolists_id, videolist_name) VALUES (1, ?)').run('默认收藏夹');
    }
  }
}

/**
 * 迁移 video_lists 表，添加 description 和 sort_order 字段
 */
function migrateVideoListsTable() {
  try {
    const columns = db.prepare("PRAGMA table_info(video_lists)").all().map(c => c.name);
    if (!columns.includes('description')) {
      db.exec("ALTER TABLE video_lists ADD COLUMN description TEXT DEFAULT ''");
      console.log('已为 video_lists 表添加 description 字段');
    }
    if (!columns.includes('sort_order')) {
      db.exec("ALTER TABLE video_lists ADD COLUMN sort_order INTEGER DEFAULT 0");
      console.log('已为 video_lists 表添加 sort_order 字段');
    }
  } catch (error) {
    console.error('迁移 video_lists 表失败:', error);
  }
}

/**
 * 初始化数据库连接
 */
function initDatabase() {
  const dbPath = getDbPath();
  const dbDir = path.dirname(dbPath);
  // 确保数据库目录存在
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  // 如果使用自定义目录但数据库文件不存在，尝试从默认位置复制
  const customDir = getCustomDataDir();
  if (customDir && !fs.existsSync(dbPath)) {
    const defaultPath = app.isPackaged
      ? path.join(app.getPath('userData'), 'data', 'bilibili.db')
      : path.join(__dirname, 'data', 'bilibili.db');
    if (fs.existsSync(defaultPath)) {
      fs.copyFileSync(defaultPath, dbPath);
    }
  }
  console.log('初始化数据库:', dbPath);
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  createTables();
  ensureTables();
}

/**
 * 创建数据库表
 */
function createTables() {
  // 歌单表
  db.exec(`
    CREATE TABLE IF NOT EXISTS video_lists (
      videolists_id INTEGER PRIMARY KEY AUTOINCREMENT,
      videolist_name TEXT NOT NULL,
      description TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0
    )
  `);

  // 视频表
  db.exec(`
    CREATE TABLE IF NOT EXISTS video (
      video_bvid TEXT PRIMARY KEY,
      video_title TEXT,
      video_img_url TEXT,
      video_startTime REAL DEFAULT 0,
      video_endtime REAL DEFAULT 0,
      video_duration REAL DEFAULT 0,
      video_url TEXT,
      up_name TEXT,
      up_home TEXT
    )
  `);

  // 歌单-视频关联表
  db.exec(`
    CREATE TABLE IF NOT EXISTS videolist_videos (
      videolist_id INTEGER,
      video_bvid TEXT,
      PRIMARY KEY (videolist_id, video_bvid),
      FOREIGN KEY (videolist_id) REFERENCES video_lists(videolists_id),
      FOREIGN KEY (video_bvid) REFERENCES video(video_bvid)
    )
  `);

}

/**
 * 执行查询并返回结果
 * @param {string} sql - SQL 查询语句
 * @param {Array} params - 查询参数
 * @returns {Array} 查询结果
 */
function executeQuery(sql, params) {
  const stmt = db.prepare(sql);
  return stmt.all(...params);
}

/**
 * 执行插入操作
 * @param {string} sql - SQL 插入语句
 * @param {Array} params - 参数
 */
function insert(sql, params) {
  const stmt = db.prepare(sql);
  return stmt.run(...params);
}

/**
 * 执行事务
 * @param {Function} callback - 事务回调
 * @returns {any} 事务返回值
 */
function runTransaction(callback) {
  const transaction = db.transaction(callback);
  return transaction();
}

/**
 * 关闭数据库连接
 */
function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

export {
  initDatabase,
  ensureTables,
  executeQuery,
  insert,
  runTransaction,
  closeDatabase,
};
