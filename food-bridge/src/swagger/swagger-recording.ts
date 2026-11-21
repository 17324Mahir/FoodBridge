import type { OpenAPIObject, SwaggerCustomOptions } from '@nestjs/swagger';
import type { Request } from 'express';

type RecordingSection = {
  name: string;
  endpoints: readonly (readonly [
    method: 'get' | 'patch' | 'post' | 'put',
    path: string,
  ])[];
};

const sections: readonly RecordingSection[] = [
  { name: 'Project overview', endpoints: [['get', '/']] },
  {
    name: 'Registration and donor login',
    endpoints: [
      ['post', '/auth/register/donor'],
      ['post', '/auth/register/ngo'],
      ['post', '/auth/register/volunteer'],
      ['post', '/auth/login'],
      ['get', '/auth/about-me'],
    ],
  },
  {
    name: 'Admin',
    endpoints: [
      ['post', '/organizations/donors/{userId}/approve'],
      ['patch', '/admin/ngos/{userId}/toggle-verification'],
      ['post', '/food-categories'],
    ],
  },
  {
    name: 'Donor',
    endpoints: [
      ['patch', '/auth/donor-profile'],
      ['post', '/donations'],
      ['patch', '/donations/{id}'],
      ['post', '/donations/{id}/publish'],
      ['get', '/donations'],
    ],
  },
  {
    name: 'NGO',
    endpoints: [
      ['post', '/reservations'],
      ['get', '/volunteers/available'],
      ['post', '/ngo-volunteers'],
      ['post', '/reservations/{id}/assignments'],
      ['post', '/delivery-records/{id}/confirm'],
      ['get', '/reports/ngo'],
    ],
  },
  {
    name: 'Volunteer',
    endpoints: [
      ['get', '/volunteers/me'],
      ['patch', '/volunteers/me/availability'],
      ['put', '/volunteers/me/schedule'],
      ['post', '/ngo-volunteers/{id}/accept'],
      ['post', '/assignments/{id}/accept'],
      ['post', '/assignments/{id}/pickup'],
      ['post', '/delivery-records/assignments/{assignmentId}/report'],
    ],
  },
];

type Show = (key: string | string[], shown: boolean) => void;
type SwaggerLayout = {
  layoutActions: { show: Show };
  layoutSelectors: { isShown(key: string[], fallback: boolean): boolean };
  specSelectors: {
    taggedOperations(): { keySeq(): Iterable<string> };
  };
};

// Swagger runs this plugin in the browser. Only tag headings use the accordion.
function recordingAccordion() {
  return {
    statePlugins: {
      layout: {
        wrapActions: {
          show:
            (show: Show, system: SwaggerLayout): Show =>
            (key, shown) => {
              if (shown && Array.isArray(key) && key[0] === 'operations-tag') {
                for (const tag of system.specSelectors
                  .taggedOperations()
                  .keySeq()) {
                  const other = ['operations-tag', tag];
                  if (
                    tag !== key[1] &&
                    system.layoutSelectors.isShown(other, false)
                  ) {
                    system.layoutActions.show(other, false);
                  }
                }
              }
              show(key, shown);
            },
        },
      },
    },
  };
}

type SwaggerOperationEntry = {
  getIn(path: string[], fallback: number): number;
};

export function makeSwaggerRecordingOptions(
  document: OpenAPIObject,
): Pick<SwaggerCustomOptions, 'patchDocumentOnRequest' | 'swaggerOptions'> {
  const paths: OpenAPIObject['paths'] = {};
  for (const { name, endpoints } of sections) {
    for (const [order, [method, path]] of endpoints.entries()) {
      const operation = document.paths[path]?.[method];
      if (!operation)
        throw new Error(
          `Missing recording endpoint ${method.toUpperCase()} ${path}`,
        );
      const recordingOperation = {
        ...operation,
        tags: [name],
        'x-recording-order': order,
      };
      (paths[path] ??= {})[method] = recordingOperation;
    }
  }

  const recording: OpenAPIObject = {
    ...document,
    paths,
    tags: sections.map(({ name }) => ({ name })),
    info: {
      ...document.info,
      description:
        'Open the sections in order and click **Execute** to run the prepared examples.',
    },
  };

  return {
    patchDocumentOnRequest: (request, _response, fullDocument) =>
      (request as Request).path.endsWith('/swagger-ui-init.js')
        ? recording
        : fullDocument,
    swaggerOptions: {
      docExpansion: 'none',
      defaultModelsExpandDepth: -1,
      operationsSorter: (
        first: SwaggerOperationEntry,
        second: SwaggerOperationEntry,
      ) =>
        first.getIn(['operation', 'x-recording-order'], 0) -
        second.getIn(['operation', 'x-recording-order'], 0),
      plugins: [recordingAccordion],
    },
  };
}
