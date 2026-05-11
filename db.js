const { app } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');

let db;

/**
 * 获取数据库文件路径
 */
function getDbPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'data', 'bilibili.db');
  }
  return path.join(__dirname, 'data', 'bilibili.db');
}

/**
 * 初始化数据库连接
 */
function initDatabase() {
  const dbPath = getDbPath();
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  createTables();
}

/**
 * 创建数据库表
 */
function createTables() {
  // 歌单表
  db.exec(`
    CREATE TABLE IF NOT EXISTS video_lists (
      videolists_id INTEGER PRIMARY KEY AUTOINCREMENT,
      videolist_name TEXT NOT NULL
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

  // 确保默认歌单存在
  const defaultPlaylist = db.prepare('SELECT * FROM video_lists WHERE videolists_id = 1').get();
  if (!defaultPlaylist) {
    db.prepare('INSERT INTO video_lists (videolists_id, videolist_name) VALUES (1, ?)').run('默认收藏夹');
  }
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
 * 关闭数据库连接
 */
function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = {
  initDatabase,
  executeQuery,
  insert,
  closeDatabase,
};
