// scripts/import-data.ts
import { PrismaClient, RestMethod, ParameterLocation } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const dataDir = './service_automation_data';

async function main() {
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const raw = fs.readFileSync(path.join(dataDir, file), 'utf-8');
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error(`❌ Invalid JSON in ${file}`);
      continue;
    }

    const name = parsed.info?.title || 'Unnamed API';
    const description = parsed.info?.description || 'No description';
    const baseEndpoint = parsed.servers?.[0]?.url || '';

    const existing = await prisma.service.findFirst({ where: { name } });
    if (existing) {
      console.log(`⚠️ Skipped: ${name} already exists.`);
      continue;
    }

    try {
      const service = await prisma.service.create({
        data: { name, description, baseEndpoint }
      });

      await prisma.subscriptionTier.createMany({
        data: [
          { name: 'Free', description: 'Basic access tier', price: 0, serviceId: service.id },
          { name: 'Pro', description: 'Premium tier with extended access', price: 9.99, serviceId: service.id }
        ]
      });

      const version = await prisma.serviceVersion.create({
        data: {
          serviceId: service.id,
          version: parsed.info?.version || '1.0.0',
          description: 'Auto-imported version'
        }
      });

      const contentRecord = await prisma.serviceContent.create({
        data: {
          title: parsed.info?.version || 'v1',
          description: 'Imported from OpenAPI JSON',
          versionId: version.id
        }
      });

      for (const [pathStr, methods] of Object.entries(parsed.paths || {})) {
        const endpoint = await prisma.endPoint.create({
          data: {
            path: pathStr,
            description: Object.values(methods)[0]?.summary || '',
            contentId: contentRecord.id
          }
        });

        for (const [method, op] of Object.entries(methods)) {
          const operation = await prisma.operation.create({
            data: {
              endPointId: endpoint.id,
              method: method.toUpperCase() as RestMethod,
              description: op.summary || '',
              deprecated: op.deprecated || false
            }
          });

          // Parameters
          for (const param of op.parameters || []) {
            await prisma.parameter.create({
              data: {
                operationId: operation.id,
                name: param.name,
                description: param.description || '',
                required: param.required || false,
                deprecated: param.deprecated || false,
                parameterLocation: param.in?.toUpperCase() as ParameterLocation,
                schemaJson: JSON.stringify(param.schema || {})
              }
            });
          }

          // RequestBody
          if (op.requestBody) {
            await prisma.requestBody.create({
              data: {
                operationId: operation.id,
                description: op.requestBody.description || '',
                required: op.requestBody.required || false,
                contentJson: JSON.stringify(op.requestBody.content || {})
              }
            });
          }

          // Responses
          for (const [statusCode, resp] of Object.entries(op.responses || {})) {
            await prisma.response.create({
              data: {
                operationId: operation.id,
                statusCode: parseInt(statusCode),
                description: resp.description || '',
                contentJson: JSON.stringify(resp.content || {}),
                headersJson: JSON.stringify(resp.headers || {})
              }
            });
          }
        }
      }

      // Tags
      for (const tag of parsed.tags || []) {
        const tagRecord = await prisma.tag.upsert({
          where: { name: tag.name },
          update: {},
          create: { name: tag.name }
        });

        await prisma.service.update({
          where: { id: service.id },
          data: {
            tags: { connect: { id: tagRecord.id } }
          }
        });
      }

      console.log(`✅ Imported ${file} as service: ${name}`);
    } catch (error) {
      console.error(`❌ Failed to import ${file}:`, error);
    }
  }
}

main().then(() => prisma.$disconnect());



