import { supabase } from './supabase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | undefined;
  }
}

export async function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const { data: { user } } = await supabase.auth.getUser();
  
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: user?.id,
      email: user?.email,
    },
    operationType,
    path
  };

  // Log the error in a structured way
  console.error('Database Error: ', JSON.stringify(errInfo));
  
  // Throw a JSON error as requested by the guidelines
  throw new Error(JSON.stringify(errInfo));
}
