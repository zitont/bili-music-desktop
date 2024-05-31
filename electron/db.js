const { app } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

let filePath;
const isPackaged = app.isPackaged;

if (isPackaged) {
  // 当应用被打包时，数据库通常位于资源的文件夹中
  filePath = path.resolve('./resources/data/bilibili.db')
} else {
  // 在开发环境中，数据库可能位于项目的data文件夹中
  filePath = path.join(__dirname, 'data', 'bilibili.db');
}

const DB_PATH = filePath;
console.log(filePath);

let db;


/**
 * 初始化数据库
 *
 * @returns Promise<sqlite3.Database> 返回连接后的sqlite3.Database实例
 */
async function initDatabase() {
    return new Promise((resolve, reject) => {
      db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Connected to the SQLite database.');
          resolve(db);
        }
      });
    });
  }
  

  
  /**
   * 执行SQL查询并返回结果
   *
   * @param sql SQL查询语句
   * @param params 查询参数
   * @returns 返回一个Promise对象，解析为查询结果数组或拒绝为错误对象
   */
  async function executeQuery(sql, params) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          console.log('Query executed successfully.');
          resolve(rows);
        }
      });
    });
  }
/**
 * 插入数据到数据库
 *
 * @param sql SQL语句
 * @param params SQL语句参数
 * @returns 返回Promise对象，表示插入操作的结果
 */
  async function insert(sql, params) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) {
          reject(err);
        } else {
          console.log('Insert executed successfully.');
          resolve();
        }
      });
    });
  }

  
  /**
   * 关闭数据库连接
   *
   * @returns Promise<void>
   */
  async function closeDatabase() {
    return new Promise((resolve, reject) => {
      if (db) {
        db.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('Database connection closed.');
            resolve();
          }
        });
      }
    });
  }

  module.exports = {
    initDatabase,
    executeQuery,
    closeDatabase,
    insert,
  };