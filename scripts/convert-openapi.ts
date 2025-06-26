import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function convertOpenAPIToServiceJson(openapiPath: string, outputPath: string) {
  const raw = fs.readFileSync(openapiPath, 'utf-8');
  const data = JSON.parse(raw);

  const name = data.info?.title;
  const description = data.info?.description;
  const version = data.info?.version;

  if (!name || !description || !version) {
    throw new Error(`❌ 缺少 name/description/version 字段`);
  }

  const operations: { method: string; path: string }[] = [];

  for (const route in data.paths) {
    const methods = data.paths[route];
    for (const method in methods) {
      operations.push({
        method: method.toUpperCase(),
        path: route,
      });
    }
  }

  const result = {
    name,
    description,
    version,
    operations,
  };

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`✅ 已保存转换结果: ${outputPath}`);
}

// ✅ 替换为你的文件名
convertOpenAPIToServiceJson(
  path.join(__dirname, '../service_automation_data/example.json'),
  path.join(__dirname, '../service_automation_data/converted-example.json')
);

