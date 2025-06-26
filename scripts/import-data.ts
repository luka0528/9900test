import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const dataDir = path.join(__dirname, '../service_automation_data');

type ServiceJson = {
  name: string;
  description: string;
  version: string;
  operations: {
    method: string;
    path: string;
  }[];
};

async function main() {
  const files = fs.readdirSync(dataDir).filter(file => file.startsWith('converted-') && file.endsWith('.json'));

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (const file of files) {
    const filePath = path.join(dataDir, file);
    try {
      const rawData = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(rawData) as ServiceJson;

      if (
        typeof data.name !== 'string' ||
        typeof data.description !== 'string' ||
        typeof data.version !== 'string'
      ) {
        throw new Error(`文件格式无效："name" / "description" / "version" 字段缺失或不是字符串 (${file})`);
      }

      // 如果服务已存在，跳过导入
      const existing = await prisma.service.findFirst({
        where: { name: data.name },
      });

      if (existing) {
        console.log(`⚠️ 已存在，跳过服务：${data.name}`);
        skipCount++;
        continue;
      }

      const service = await prisma.service.create({
        data: {
          name: data.name,
          description: data.description,
        },
      });

      const serviceVersion = await prisma.serviceVersion.create({
        data: {
          version: data.version,
          serviceId: service.id,
        },
      });

      for (const op of data.operations) {
        await prisma.operation.create({
          data: {
            method: op.method,
            path: op.path,
            serviceVersionId: serviceVersion.id,
          },
        });
      }

      console.log(`✅ 成功导入服务：${data.name}`);
      successCount++;
    } catch (e: any) {
      console.error(`❌ 导入文件 ${file} 出错：\n${e.message}`);
      failCount++;
    }
  }

  console.log(`\n📊 导入完成：成功 ${successCount} 个，跳过 ${skipCount} 个，失败 ${failCount} 个`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(err => {
    console.error('❗ 全局失败：', err);
    prisma.$disconnect();
    process.exit(1);
  });
