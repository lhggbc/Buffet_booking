import express from 'express';
import multer from 'multer';
import { promises as fs } from 'fs';
import path from 'path';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = './static/uploads/avatars/';
    // if (!fs.existsSync(uploadPath)) {
    //   fs.mkdirSync(uploadPath, { recursive: true });
    //   console.log(`Directory created: ${uploadPath}`);
    // }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mime = allowedTypes.test(file.mimetype);
  if (ext && mime) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif).'));
  }
};

const upload = multer({
  storage: storage,
  // fileFilter: fileFilter,
  // limits: { fileSize: 5 * 1024 * 1024 }, // 限制文件大小为5MB
});

const users = new Map();

async function init_userdb() {
  try {
    await fs.access('./users.json');
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log('users.json not found, creating a new one');
      await fs.writeFile('./users.json', JSON.stringify([]));
    } else {
      console.error('Cannot access users.json:', err);
      throw err;
    }
  }
  try {
    const data = await fs.readFile('./users.json', 'utf-8');
    const jsonData = JSON.parse(data);

    jsonData.forEach((user) => {
      users.set(user.uid, user);
    });

    console.log('users.json loaded:', users);
  } catch (err) {
    console.error('Error detected when reading users.json', err);
  }
}

async function validate_user(uid, password) {
  await init_userdb();
  const user = users.get(uid);
  if (!user || user.password !== password) {
    return false;
  }
  return {
    uid: user.uid,
    role: user.role,
    enabled: user.enabled,
  };
}

async function update_user(uid, nickname, email, phonenum, password, gender, birthdate, avatarPath) {
  try {
    if (!uid || !nickname || !email || !phonenum || !password || !gender || !birthdate || !avatarPath) {
      throw new Error('Invalid input: All fields are required.');
    }

    const user = {
      uid: uid.trim(),
      nickname: nickname.trim(),
      email: email.trim(),
      phonenum: phonenum.trim(),
      password: password.trim(),
      gender: gender,
      birthdate: birthdate,
      avatar: avatarPath,
      enabled: true,
      role: 'user',
    };

    users.set(uid, user);

    const userjson = Array.from(users.values());

    await fs.writeFile('./users.json', JSON.stringify(userjson, null, 2));

    console.log(`User ${uid} saved successfully.`);
    return true;
  } catch (err) {
    console.error('Error updating user:', err);
    return false;
  }
}

async function uid_exist(uid) {
  await init_userdb();
  return users.has(uid);
}

const login = express.Router();
const form = multer();

login.post('/login', form.none(), async (req, res) => {
  if (users.size === 0) {
    await init_userdb();
  }
  if (req.session.logged === true) {
    req.session.logged = false;
  }
  console.log(req.body);

  const { uid, password } = req.body;
  const user = await validate_user(uid, password);

  if (user) {
    if (!user.enabled) {
      return res.status(401).json({
        status: 'failed',
        message: `User \`${uid}\`is currently disabled`,
      });
    }
    req.session.uid = user.uid;
    req.session.role = user.role;
    req.session.logged = true;
    req.session.timestamp = Date.now();
    return res.json({
      status: 'success',
      user: {
        uid: user.uid,
        role: user.role,
      },
    });
  } else {
    return res.status(401).json({
      status: 'failed',
      message: 'Incorrect uid and password',
    });
  }
});

login.post('/logout', (req, res) => {
  console.log('Logging out user:', req.session.uid);

  if (req.session.logged === true) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.status(500).json({ status: 'failed', message: 'Logout failed' });
      }
      console.log('Session destroyed. User logged out.');
      return res.status(200).json({ status: 'success', message: 'Logged out successfully' });
    });
  } else {
    console.log('Session not found or user not logged in');
    return res.status(401).json({
      status: 'failed',
      message: 'Unauthorized: No active session',
    });
  }
});

login.post('/register', upload.single('avatar'), async (req, res) => {
  console.log('Registering new user');
  if (users.size === 0) {
    await init_userdb();
  }
  const { uid, nickname, email, phonenum, password, gender, birthdate } = req.body;
  console.log('Success to get body');
  const avatarFile = req.file;
  console.log('Success to get file');
  console.log({
    uid,
    nickname,
    email,
    phonenum,
    password,
    gender,
    birthdate,
    avatar: avatarFile ? avatarFile.filename : 'No avatar uploaded',
  });

  if (!uid || !nickname || !email || !phonenum || !password || !gender || !birthdate || !avatarFile) {
    return res.status(400).json({
      status: 'failed',
      message: 'Missing fields or avatar. Please fill in all the details and upload an avatar.',
    });
  }

  if (uid.length < 3) {
    return res.status(400).json({
      status: 'failed',
      message: 'User ID must be at least 3 characters long.',
    });
  }

  if (await uid_exist(uid)) {
    return res.status(400).json({
      status: 'failed',
      message: `User ID ${uid} already exists.`,
    });
  }

  if (nickname.length < 3) {
    return res.status(400).json({
      status: 'failed',
      message: 'Nickname must be at least 3 characters long.',
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      status: 'failed',
      message: 'Invalid email format.',
    });
  }

  const phoneRegex = /^[0-9]{10,15}$/;
  if (!phoneRegex.test(phonenum)) {
    return res.status(400).json({
      status: 'failed',
      message: 'Invalid phone number. It must be 10-15 digits long.',
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      status: 'failed',
      message: 'Password must be at least 8 characters long.',
    });
  }
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      status: 'failed',
      message: 'Password must contain at least one letter and one number.',
    });
  }

  if (gender !== 'male' && gender !== 'female') {
    return res.status(400).json({
      status: 'failed',
      message: 'Gender must be either `male` or `female`.',
    });
  }

  const today = new Date();
  const birthDate = new Date(birthdate);
  if (isNaN(birthDate.getTime()) || birthDate >= today) {
    return res.status(400).json({
      status: 'failed',
      message: 'Invalid birthdate',
    });
  }

  const avatarPath = path.join('uploads', 'avatars', avatarFile.filename);

  try {
    const userCreated = await update_user(uid, nickname, email, phonenum, password, gender, birthdate, avatarPath);

    if (userCreated) {
      return res.status(201).json({
        status: 'success',
        message: 'User created successfully.',
        user: {
          uid: uid,
          nickname: nickname,
          email: email,
          phonenum: phonenum,
          gender: gender,
          birthdate: birthdate,
          avatar: avatarPath, // 返回头像路径
        },
      });
    } else {
      // 如果用户创建失败，删除已上传的头像文件以避免冗余文件
      fs.unlinkSync(path.join(__dirname, '..', 'public', avatarPath));
      return res.status(500).json({
        status: 'failed',
        message: 'Account was created but could not be saved to the database.',
      });
    }
  } catch (err) {
    console.error('Error during user creation:', err);
    // 如果发生错误，删除已上传的头像文件以避免冗余文件
    if (avatarFile) {
      fs.unlinkSync(path.join(__dirname, '..', 'public', avatarPath));
    }
    return res.status(500).json({
      status: 'failed',
      message: 'An unexpected error occurred. Please try again later.',
    });
  }
});
export default login;
