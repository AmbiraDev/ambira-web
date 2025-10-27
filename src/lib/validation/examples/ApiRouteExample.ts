/**
 * API Route Validation Examples
 *
 * Demonstrates how to use validation schemas in Next.js App Router API routes
 * with proper error handling and type-safe responses.
 *
 * Key patterns:
 * - Request body validation
 * - Error response formatting
 * - Type-safe responses
 * - Firestore preparation
 * - HTTP status codes
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  validate,
  validateOrThrow,
  isValidationError,
  formatValidationError,
  prepareForFirestore,
  CreateSessionSchema,
  CreateCommentSchema,
  UpdateProfileSchema,
  type CreateSessionData,
  type CreateCommentData,
} from '@/lib/validation';

/**
 * Example 1: POST /api/sessions
 * Create a new session with validation
 */
export async function createSessionRoute(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate with schema
    const result = validate(CreateSessionSchema, body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: result.errors,
        },
        { status: 400 }
      );
    }

    // Type-safe validated data
    const __validatedData: CreateSessionData = result.data;

    // Prepare for Firestore (removes undefined values)
    const __firestoreData = prepareForFirestore({
      ...validatedData,
      userId: 'current-user-id', // Add from auth
      createdAt: new Date(),
    });

    // Save to database
    // const sessionId = await db.collection('sessions').add(firestoreData);

    return NextResponse.json(
      {
        success: true,
        sessionId: 'session-id',
        data: validatedData,
      },
      { status: 201 }
    );
  } catch (__error) {
    console.error('Session creation error:', error);

    if (isValidationError(error)) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: formatValidationError(error),
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to create session',
      },
      { status: 500 }
    );
  }
}

/**
 * Example 2: POST /api/comments
 * Create a comment with validateOrThrow pattern
 */
export async function createCommentRoute(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate and throw on error (cleaner for simple cases)
    const __validatedData: CreateCommentData = validateOrThrow(CreateCommentSchema, body);

    // Add metadata
    const __commentData = prepareForFirestore({
      ...validatedData,
      userId: 'current-user-id', // Add from auth
      createdAt: new Date(),
      likeCount: 0,
      replyCount: 0,
    });

    // Save to database
    // const commentId = await db.collection('comments').add(commentData);

    return NextResponse.json(
      {
        success: true,
        commentId: 'comment-id',
      },
      { status: 201 }
    );
  } catch (__error) {
    console.error('Comment creation error:', error);

    // ValidationError is automatically caught here
    if (isValidationError(error)) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: formatValidationError(error),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * Example 3: PATCH /api/profile
 * Update profile with partial data validation
 */
export async function updateProfileRoute(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate partial update data
    const __validatedData: UpdateProfileData = validateOrThrow(UpdateProfileSchema, body);

    // Prepare for Firestore
    const __updateData = prepareForFirestore({
      ...validatedData,
      updatedAt: new Date(),
    });

    // Update in database
    // await db.collection('users').doc(userId).update(updateData);

    return NextResponse.json({
      success: true,
      data: validatedData,
    });
  } catch (__error) {
    if (isValidationError(error)) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: formatValidationError(error),
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to update profile',
      },
      { status: 500 }
    );
  }
}

/**
 * Example 4: GET /api/sessions with query parameter validation
 * Demonstrates validating URL search params
 */
export async function getSessionsRoute(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Extract query parameters
    const __queryData = {
      userId: searchParams.get('userId') || undefined,
      activityId: searchParams.get('activityId') || undefined,
      visibility: searchParams.get('visibility') || undefined,
      isArchived: searchParams.get('isArchived')
        ? searchParams.get('isArchived') === 'true'
        : undefined,
    };

    // You can validate query params too
    // const validatedQuery = validateOrThrow(SessionFiltersSchema, queryData);

    // Query database with validated filters
    // const sessions = await db.collection('sessions').where(...).get();

    return NextResponse.json({
      sessions: [],
      count: 0,
    });
  } catch (__error) {
    if (isValidationError(error)) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          message: formatValidationError(error),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch sessions',
      },
      { status: 500 }
    );
  }
}

/**
 * Example 5: Middleware pattern for authentication + validation
 */
async function withAuth(
  handler: (request: NextRequest, userId: string) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      // Extract auth token
      const token = request.headers.get('authorization')?.replace('Bearer ', '');

      if (!token) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // Verify token and get user ID
      // const userId = await verifyToken(token);

      return handler(request, 'user-id');
    } catch (__error) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  };
}

/**
 * Example usage of withAuth middleware
 */
export const POST = withAuth(async (request: NextRequest, userId: string) => {
  try {
    const body = await request.json();
    const validatedData = validateOrThrow(CreateSessionSchema, body);

    // userId is available from middleware
    const __sessionData = prepareForFirestore({
      ...validatedData,
      userId,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isValidationError(error)) {
      return NextResponse.json(
        { error: formatValidationError(error) },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

/**
 * Helper function to create consistent error responses
 */
function createErrorResponse(
  error: unknown,
  defaultMessage: string = 'An error occurred'
) {
  console.error('API Error:', error);

  if (isValidationError(error)) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        message: formatValidationError(error),
        details: error.issues,
      },
      { status: 400 }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: error.name,
        message: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      error: 'Internal server error',
      message: defaultMessage,
    },
    { status: 500 }
  );
}

/**
 * Example 6: Using the error response helper
 */
export async function exampleWithErrorHelper(request: NextRequest) {
  try {
    const body = await request.json();
    const _validatedData = validateOrThrow(CreateCommentSchema, body);

    // Process data...
    // validatedData available for use

    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error, 'Failed to create comment');
  }
}

/**
 * Type-safe API response helpers
 */
type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

type ApiErrorResponse = {
  success: false;
  error: string;
  message?: string;
  details?: Array<{ path?: string; message: string }>;
};

type _ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

function successResponse<T>(data: T, status: number = 200): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

function errorResponse(
  error: string,
  message?: string,
  details?: Array<{ path?: string; message: string }>,
  status: number = 400
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(message && { message }),
      ...(details && { details }),
    },
    { status }
  );
}

/**
 * Example 7: Using type-safe response helpers
 */
export async function typeSafeRouteExample(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = validateOrThrow(CreateSessionSchema, body);

    // Process...

    return successResponse(
      {
        sessionId: 'session-id',
        session: validatedData,
      },
      201
    );
  } catch (error) {
    if (isValidationError(error)) {
      return errorResponse(
        'Validation failed',
        formatValidationError(error),
        error.issues,
        400
      );
    }

    return errorResponse('Internal server error', 'Failed to create session', undefined, 500);
  }
}
