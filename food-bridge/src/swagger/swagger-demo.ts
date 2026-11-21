import { randomBytes } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import type {
  OpenAPIObject,
  SecuritySchemeObject,
  SwaggerCustomOptions,
} from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import { DataSource } from 'typeorm';
import { AuthService } from '../auth/auth.service.js';
import { AvailabilityStatus } from '../common/availability-status.enum.js';
import { seedSwaggerDemo } from './swagger-demo-data.js';
import { makeSwaggerRecordingOptions } from './swagger-recording.js';

const demoDatabase = 'foodbridge_swagger_demo';
const methods = ['get', 'post', 'patch', 'put', 'delete'] as const;

type DemoData = Awaited<ReturnType<typeof seedSwaggerDemo>>;
type DemoAccount = keyof DemoData['accounts'];
type DemoExample = {
  account?: DemoAccount;
  body?: object;
  params?: Record<string, string | number>;
};
type DemoPaths = Record<
  string,
  Partial<Record<(typeof methods)[number], DemoExample>>
>;

export function configureSwaggerDemo(): boolean {
  if (process.env.FOODBRIDGE_SWAGGER_DEMO !== 'true') {
    return false;
  }
  const host = process.env.DB_HOST;
  const local =
    ['localhost', '127.0.0.1', '::1'].includes(host ?? '') ||
    host?.startsWith('/');
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.DB_NAME !== demoDatabase ||
    !local
  ) {
    throw new Error(
      `Swagger demo requires the local ${demoDatabase} database and a development environment.`,
    );
  }
  // Demo tokens work only in this run because it has its own signing key.
  process.env.JWT_SECRET = randomBytes(32).toString('hex');
  process.env.JWT_EXPIRY = '2h';
  return true;
}

function examples(data: DemoData): DemoPaths {
  const pagination = { page: 1, limit: 10 };
  return {
    '/auth/register/donor': { post: { body: data.registration.donor } },
    '/auth/register/ngo': { post: { body: data.registration.ngo } },
    '/auth/register/volunteer': { post: { body: data.registration.volunteer } },
    '/auth/login': {
      post: {
        body: {
          emailOrPhone: data.accounts.donor.email,
          password: data.password,
        },
      },
    },
    '/auth/about-me': { get: { account: 'donor' } },
    '/auth/account': { delete: { account: 'accountToClose' } },
    '/auth/donor-profile': {
      patch: {
        account: 'donor',
        body: { address: 'House 12, Dhanmondi, Dhaka' },
      },
    },
    '/auth/ngo-profile': {
      patch: { account: 'ngo', body: { address: 'Banani, Dhaka' } },
    },
    '/auth/volunteer-profile': {
      patch: { account: 'volunteer', body: { address: 'Mirpur, Dhaka' } },
    },

    '/volunteers/me': {
      get: { account: 'volunteer' },
      patch: {
        account: 'volunteer',
        body: { address: 'House 8, Dhanmondi, Dhaka' },
      },
      delete: { account: 'volunteerToClose' },
    },
    '/volunteers/me/availability': {
      patch: {
        account: 'volunteer',
        body: { availability: AvailabilityStatus.AVAILABLE },
      },
    },
    '/volunteers/me/schedule': {
      get: { account: 'volunteer' },
      put: { account: 'volunteer', body: { slots: [data.weekdaySlot] } },
    },
    '/volunteers/available': {
      get: {
        account: 'ngo',
        params: { day: data.weekdaySlot.dayOfWeek, time: '10:00' },
      },
    },
    '/volunteers': { get: { account: 'ngo', params: pagination } },
    '/volunteers/{id}': {
      get: { account: 'ngo', params: { id: data.accounts.volunteer.userId } },
      delete: {
        account: 'admin',
        params: { id: data.volunteerForAdmin.userId },
      },
    },
    '/volunteers/{id}/schedule': {
      get: { account: 'ngo', params: { id: data.accounts.volunteer.userId } },
    },

    '/food-categories': {
      get: { account: 'donor', params: pagination },
      post: { account: 'admin', body: { name: data.categoryName } },
    },
    '/food-categories/{id}': {
      get: { account: 'donor', params: { id: data.category.id } },
      patch: {
        account: 'admin',
        params: { id: data.categoryToEdit.id },
        body: { isActive: false },
      },
      delete: { account: 'admin', params: { id: data.categoryToDelete.id } },
    },

    '/donations': {
      get: {
        account: 'donor',
        params: { ...pagination, categoryId: data.category.id },
      },
      post: { account: 'donor', body: data.donationBody },
    },
    '/donations/{id}': {
      get: { account: 'donor', params: { id: data.draft.id } },
      patch: {
        account: 'donor',
        params: { id: data.draft.id },
        body: { title: 'Vegetable rice for 20' },
      },
      delete: { account: 'donor', params: { id: data.archiveDraft.id } },
    },
    '/donations/{id}/publish': {
      post: { account: 'donor', params: { id: data.draft.id } },
    },
    '/donations/{id}/cancel': {
      post: { account: 'donor', params: { id: data.toWithdraw.id } },
    },

    '/ngo-volunteers': {
      get: { account: 'ngo', params: pagination },
      post: {
        account: 'ngo',
        body: { volunteerId: data.volunteerToInvite.userId },
      },
    },
    '/ngo-volunteers/{id}': {
      get: { account: 'ngo', params: { id: data.activeMembership.id } },
      delete: { account: 'ngo', params: { id: data.membershipToRemove.id } },
    },
    '/ngo-volunteers/{id}/accept': {
      post: {
        account: 'volunteerToAccept',
        params: { id: data.invitationToAccept.id },
      },
    },
    '/ngo-volunteers/{id}/decline': {
      post: {
        account: 'volunteerToDecline',
        params: { id: data.invitationToDecline.id },
      },
    },

    '/reservations': {
      get: { account: 'ngo', params: pagination },
      post: { account: 'ngo', body: { donationId: data.toReserve.id } },
    },
    '/reservations/{id}': {
      get: { account: 'ngo', params: { id: data.toAssign.id } },
    },
    '/reservations/{id}/cancel': {
      post: {
        account: 'ngo',
        params: { id: data.toCancel.id },
        body: { reason: 'The pickup team is unavailable.' },
      },
    },
    '/reservations/{id}/assignments': {
      post: {
        account: 'ngo',
        params: { id: data.toAssign.id },
        body: {
          membershipId: data.activeMembership.id,
          notes: 'Collect from Gate 2.',
        },
      },
    },

    '/assignments': { get: { account: 'volunteer', params: pagination } },
    '/assignments/{id}': {
      get: { account: 'volunteer', params: { id: data.offerToAccept.id } },
    },
    '/assignments/{id}/accept': {
      post: { account: 'volunteer', params: { id: data.offerToAccept.id } },
    },
    '/assignments/{id}/decline': {
      post: { account: 'volunteer', params: { id: data.offerToDecline.id } },
    },
    '/assignments/{id}/cancel': {
      post: { account: 'ngo', params: { id: data.offerToCancel.id } },
    },
    '/assignments/{id}/pickup': {
      post: { account: 'volunteer', params: { id: data.toPickUp.id } },
    },

    '/delivery-records/assignments/{assignmentId}/report': {
      post: {
        account: 'volunteer',
        params: { assignmentId: data.toReport.id },
        body: data.deliveryBody,
      },
    },
    '/delivery-records/{id}/confirm': {
      post: { account: 'ngo', params: { id: data.toConfirm.id } },
    },
    '/delivery-records/{id}/dispute': {
      post: {
        account: 'ngo',
        params: { id: data.toDispute.id },
        body: { reason: 'The recipient reported a quantity mismatch.' },
      },
    },
    '/reports/ngo': { get: { account: 'ngo' } },
    '/admin/users/{userId}': {
      delete: {
        account: 'admin',
        params: { userId: data.userForAdmin.userId },
      },
    },
    '/admin/ngos/{userId}/toggle-verification': {
      patch: { account: 'admin', params: { userId: data.pendingNgo.userId } },
    },
  };
}

export async function makeSwaggerDemo(
  app: INestApplication,
  document: OpenAPIObject,
): Promise<SwaggerCustomOptions> {
  app.use((request: Request, response: Response, next: NextFunction) => {
    if (
      !/^(127\.0\.0\.1|localhost)(:\d+)?$/i.test(request.headers.host ?? '')
    ) {
      response.sendStatus(403);
      return;
    }
    response.setHeader('Cache-Control', 'no-store');
    next();
  });

  const data = await seedSwaggerDemo(app.get(DataSource));
  const auth = app.get(AuthService);
  document.components ??= {};
  const schemes = (document.components.securitySchemes ??= {});
  const authorizations = await Promise.all(
    Object.entries(data.accounts).map(async ([account, user]) => {
      const name = `demo-${account}`;
      const schema: SecuritySchemeObject = {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: `Demo account for ${user.name}.`,
      };
      schemes[name] = schema;
      const value = await auth.login({
        emailOrPhone: user.email,
        password: data.password,
      });
      return [name, { name, schema, value }] as const;
    }),
  );
  document.info.description =
    'Local Swagger demo. Expand an endpoint and click **Execute**. The request uses the indicated demo account and prepared inputs. ' +
    'Each write example has data ready for its first execution. Restart the demo server and reload this page for fresh examples.';

  for (const [path, route] of Object.entries(examples(data))) {
    for (const method of methods) {
      const example = route[method];
      if (!example) continue;
      const operation = document.paths[path]?.[method];
      if (!operation)
        throw new Error(
          `Missing Swagger operation ${method.toUpperCase()} ${path}`,
        );

      if (example.account) {
        operation.security = [{ [`demo-${example.account}`]: [] }];
        const note = `Demo account **${data.accounts[example.account].name}**.`;
        operation.description = operation.description
          ? `${operation.description}\n\n${note}`
          : note;
      }
      for (const param of operation.parameters ?? []) {
        if ('$ref' in param) continue;
        const value = example.params?.[param.name];
        if (value !== undefined) {
          param.example = value;
          param.schema = { ...param.schema, default: value };
        }
      }
      const body = operation.requestBody;
      if (example.body && body && !('$ref' in body)) {
        body.content['application/json'].example = example.body;
      }
    }
  }

  const recording = makeSwaggerRecordingOptions(document);
  return {
    ...recording,
    customSiteTitle: 'FoodBridge Swagger Demo',
    swaggerOptions: {
      ...recording.swaggerOptions,
      authAction: Object.fromEntries(authorizations),
      tryItOutEnabled: true,
      persistAuthorization: false,
      validatorUrl: null,
    },
  };
}
