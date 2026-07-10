import { readdir, readFile, rm, stat, mkdir, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";

const distDir = "dist";
const releaseDir = "releases";
const zipPath = join(releaseDir, "skool-a-fish-game-itch.zip");

const crcTable = new Uint32Array(256);

for (let index = 0; index < 256; index += 1) {
  let value = index;

  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }

  crcTable[index] = value >>> 0;
}

const crc32 = (data) => {
  let crc = 0xffffffff;

  for (const byte of data) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
};

const dosDateTime = (date) => {
  const year = Math.max(1980, date.getFullYear());
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();

  return { dosDate, dosTime };
};

const collectFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(absolutePath)));
      continue;
    }

    if (entry.isFile()) {
      files.push(absolutePath);
    }
  }

  return files;
};

const uint16 = (value) => {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(value);
  return buffer;
};

const uint32 = (value) => {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value >>> 0);
  return buffer;
};

const main = async () => {
  const indexPath = join(distDir, "index.html");

  try {
    await stat(indexPath);
  } catch {
    throw new Error("dist/index.html is missing. Run npm run build:itch before packaging.");
  }

  await rm(releaseDir, { force: true, recursive: true });
  await mkdir(releaseDir, { recursive: true });

  const files = await collectFiles(distDir);
  const chunks = [];
  const centralDirectory = [];
  let offset = 0;

  for (const filePath of files) {
    const data = await readFile(filePath);
    const fileName = relative(distDir, filePath).split(sep).join("/");
    const fileNameBytes = Buffer.from(fileName);
    const modified = await stat(filePath);
    const { dosDate, dosTime } = dosDateTime(modified.mtime);
    const checksum = crc32(data);

    const localHeader = Buffer.concat([
      uint32(0x04034b50),
      uint16(20),
      uint16(0),
      uint16(0),
      uint16(dosTime),
      uint16(dosDate),
      uint32(checksum),
      uint32(data.length),
      uint32(data.length),
      uint16(fileNameBytes.length),
      uint16(0),
      fileNameBytes,
    ]);

    chunks.push(localHeader, data);

    centralDirectory.push(
      Buffer.concat([
        uint32(0x02014b50),
        uint16(20),
        uint16(20),
        uint16(0),
        uint16(0),
        uint16(dosTime),
        uint16(dosDate),
        uint32(checksum),
        uint32(data.length),
        uint32(data.length),
        uint16(fileNameBytes.length),
        uint16(0),
        uint16(0),
        uint16(0),
        uint16(0),
        uint32(0),
        uint32(offset),
        fileNameBytes,
      ]),
    );

    offset += localHeader.length + data.length;
  }

  const centralDirectoryStart = offset;
  const centralDirectoryBuffer = Buffer.concat(centralDirectory);
  const endRecord = Buffer.concat([
    uint32(0x06054b50),
    uint16(0),
    uint16(0),
    uint16(files.length),
    uint16(files.length),
    uint32(centralDirectoryBuffer.length),
    uint32(centralDirectoryStart),
    uint16(0),
  ]);

  await writeFile(zipPath, Buffer.concat([...chunks, centralDirectoryBuffer, endRecord]));
  console.log(`Created ${zipPath}`);
  console.log("Upload this ZIP to itch.io as an HTML/browser playable file.");
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
