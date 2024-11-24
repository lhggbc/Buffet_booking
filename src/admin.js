import express from 'express';
import multer from 'multer';
import { promises as fs } from 'fs';
import { fetch_all_users, fetch_user, uid_exist, update_user } from './usersdb.js';
import path from 'path';
import bcrypt from 'bcrypt';

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

const router = express.Router();

function checkAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    next();
  } else {
    res.redirect('/login'); // Redirect to login if not authenticated
  }
}

router.get('/account-management', async (req, res) => {
  console.log('Fetching all users...');
  try {
    const users = await fetch_all_users();
    console.log('Retrieved users:', users);
    return res.json(users);
  } catch (err) {
    console.error('Error retrieving users:', err);
    res.status(500).send('Internal server error.');
  }
});

router.post('/me', async (req, res) => {
  if (req.session.logged === true && req.session.role === 'admin') {
    try {
      const { uid } = req.body;
      req.session.uid_admin = uid;
      return res.json({
        status: 'success',
        message: 'Query been set',
      });
    } catch (err) {
      console.error('Error querying user:', err);
      res.status(500).send('Internal server error.');
    }
  }
});

router.get('/me', async (req, res) => {
  if (req.session.logged === true && req.session.role === 'admin') {
    try {
      const user = await fetch_user(req.session.uid_admin);
      console.log('Retrieved user:', user);
      return res.json({
        status: 'success',
        user: user,
      });
    } catch (err) {
      console.error('Error retrieving user:', err);
      res.status(500).send('Internal server error.');
    }
  }
});

router.post('/profile-edit-admin', upload.single('avatar'), async (req, res) => {
  const { uid, nickname, email, phonenum, password, gender, birthdate, avatar } = req.body;
  const avatarFile = req.file;
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log({
    uid,
    nickname,
    email,
    phonenum,
    password,
    gender,
    birthdate,
    avatar: avatarFile ? avatarFile.filename : avatar,
  });
  if (!uid || !nickname || !email || !phonenum || !password || !gender || !birthdate) {
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
  const passwordRegex = /^(?=.*[A-Za-z]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      status: 'failed',
      message: 'Password must be at least 8 characters long and contain at least one letter.',
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
  const avatarPath = avatarFile
    ? path.join('uploads', 'avatars', avatarFile.filename) // 新上传头像
    : avatar; // 使用旧路径

  console.log('Avatar path:', avatarPath);

  try {
    const userCreated = await update_user(
      uid,
      nickname,
      email,
      phonenum,
      hashedPassword,
      gender,
      birthdate,
      avatarPath
    );
    if (userCreated) {
      return res.status(201).json({
        status: 'success',
        user: {
          uid: uid,
          nickname: nickname,
          email: email,
          phonenum: phonenum,
          gender: gender,
          birthdate: birthdate,
          avatar: avatarPath, // 返回头像路径
          password: hashedPassword,
        },
      });
    } else {
      // 如果用户创建失败，删除已上传的头像文件以避免冗余文件
      fs.unlinkSync(avatarPath);
      return res.status(500).json({
        status: 'failed',
        message: 'Account was created but could not be saved to the database.',
      });
    }
  } catch (err) {
    console.error('Error during user creation:', err);
    // 如果发生错误，删除已上传的头像文件以避免冗余文件
    if (avatarFile) {
      fs.unlinkSync(avatarPath);
    }
    return res.status(500).json({
      status: 'failed',
      message: 'An unexpected error occurred. Please try again later.',
    });
  }
});

export default router;
