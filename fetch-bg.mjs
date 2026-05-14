import fs from 'fs';
import https from 'https';
import path from 'path';

const downloadFile = (url, dest) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to get '${url}' (${res.statusCode})`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
      file.on('error', (err) => {
        fs.unlink(dest, () => reject(err));
      });
    }).on('error', reject);
  });
};

const url = 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=1000&auto=format&fit=crop';
const dest = path.join(process.cwd(), 'src/assets/paper-bg.jpg');

downloadFile(url, dest)
  .then(() => console.log('Downloaded paper background'))
  .catch(err => console.error('Error downloading:', err));
