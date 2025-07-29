import { extractWompiErrorDetails } from './wompi.util';

describe('extractWompiErrorDetails', () => {
  it('should extract error details from response error', () => {
    const error = {
      response: {
        data: {
          error: {
            type: 'INVALID_REQUEST',
            messages: { field: ['Invalid data'] },
          },
        },
      },
    };
    const result = extractWompiErrorDetails(error);
    expect(result).toEqual({
      code: 'INVALID_REQUEST',
      message: 'Invalid data',
      details: JSON.stringify(error.response.data.error),
    });
  });

  it('should handle unknown error', () => {
    const error = new Error('oops');
    const result = extractWompiErrorDetails(error);
    expect(result).toEqual({
      code: 'UNKNOWN_ERROR',
      message: 'oops',
    });
  });
});
