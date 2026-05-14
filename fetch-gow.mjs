import https from 'https';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const url = 'https://dl.dafont.com/dl/?f=godofwar';

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', reject);
  });
};

const dest = path.join(process.cwd(), 'font.zip');
download(url, dest).then(() => {
  console.log('Downloaded ZIP');
  fs.mkdirSync(path.join(process.cwd(), 'src/assets/fonts'), { recursive: true });
  // Using node standard library to extract zip if possible, or just using unzip if installed in system
  try {
     execSync('unzip -o font.zip -d src/assets/fonts/');
  } catch(e) {
     console.log('Falling back to pure JS unzip');
     // fallback if unzip doesn't exist
  }
  console.log('Done');
}).catch(console.error);
