import fs from 'fs/promises';
import client from './dbclient.js';

async function init_userdb() {
  // const hktDate = new Date().toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong' });

  // const port = 8080;
  // console.log(`${hktDate}`);
  // console.log(`Server started at http://127.0.0.1:${port}`);
  try {
    const users = client.db('buffet_booking').collection('users');
    const userCount = await users.countDocuments();

    if (userCount === 0) {
      const data = await fs.readFile('./users.json');
      const usersData = JSON.parse(data);
      const result = await users.insertMany(usersData);
      console.log(`Added ${result.insertedCount} users`);
    } else {
      console.log('Events collection is already populated.');
    }
  } catch (err) {
    console.error('Unable to initialize the database!', err);
    process.exit(1);
  }
}

async function validate_user(uid, password) {
  try {
    if (!uid || !password) {
      return false;
    }
    const users = client.db('buffet_booking').collection('users');
    const user = await users.findOne({ uid: uid, password: password });
    if (user) {
      return user;
    } else {
      return false;
    }
  } catch (err) {
    console.error('Unable to fetch from database!', err);
    return false;
  }
}

async function update_user(uid, nickname, email, phonenum, password, gender, birthdate, avatarPath) {
  try {
    // 校验输入，确保所有字段都存在
    if (!uid || !nickname || !email || !phonenum || !password || !gender || !birthdate || !avatarPath) {
      throw new Error('Invalid input: All fields are required.');
    }

    // 获取 MongoDB 集合
    const users = client.db('buffet_booking').collection('users');

    // 组织用户数据
    const user = {
      uid: uid.trim(),
      nickname: nickname.trim(),
      email: email.trim(),
      phonenum: phonenum.trim(),
      password: password.trim(),
      gender: gender,
      birthdate: birthdate,
      avatar: avatarPath,
      enabled: true, // 默认启用用户
      role: 'user', // 默认角色为用户
    };

    // 使用 MongoDB 的 updateOne 方法进行更新或插入
    const filter = { uid: uid.trim() }; // 查找条件：uid
    const update = { $set: user }; // 要更新的数据
    const options = { upsert: true }; // 如果没有匹配记录则插入

    // 执行更新操作
    const result = await users.updateOne(filter, update, options);

    // 根据结果输出日志
    if (result.matchedCount > 0 && result.modifiedCount > 0) {
      console.log(`User ${uid} updated successfully.`);
    } else if (result.upsertedCount > 0) {
      console.log(`User ${uid} inserted successfully.`);
    } else {
      console.log(`No changes made for user ${uid}.`);
    }

    return true;
  } catch (err) {
    console.error('Error updating user:', err);
    return false;
  }
}

async function fetch_user(uid) {
  try {
    const users = client.db('buffet_booking').collection('users');
    const user = await users.findOne({ uid: uid });
    return user;
  } catch (err) {
    console.error('Unable to fetch from database!', err);
  }
}

async function uid_exist(uid) {
  try {
    const users = client.db('lab5db').collection('users');
    const user = await users.findOne({ uid: uid });
    if (user === null) {
      return false;
    } else {
      return true;
    }
  } catch (err) {
    console.error('Unable to fetch from database!', err);
  }
}

init_userdb().catch(console.dir);
// validate_user('alice', 'ecila').then((res) => console.log(res));
// update_user('22103456D', '22103456D', 'user', false).then((res) => console.log(res));
// fetch_user('22103456D').then((res) => console.log(res));
// username_exist('test').then((res) => console.log(res));
// update_user('bob', 'bob4321', 'student', true).then((res) => console.log(res));

export { validate_user, update_user, fetch_user, uid_exist, init_userdb };