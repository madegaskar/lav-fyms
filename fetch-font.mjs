import fs from 'fs';
import https from 'https';
import path from 'path';

const url = 'https://dl.dafont.com/dl/?f=godofwar';
const dest = path.join(process.cwd(), 'font.zip');

https.get(url, (res) => {
  const file = fs.createWriteStream(dest);
  res.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Downloaded font.zip');
  });
}).on('error', (err) => {
  console.error('Error:', err);
});
