//GUO Beichen 22103456D, Li Haige 22101812D
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.CONNECTION_STR) {
  console.error('CONNECTION_STR is not defined');
  process.exit(1);
}

export default {
  CONNECTION_STR: process.env.CONNECTION_STR,
};
