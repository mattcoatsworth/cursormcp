// This file is maintained for compatibility with existing imports
// All database operations are now handled through Supabase
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../shared/database.types';
import * as schema from "@shared/schema";

// Import directly from supabase.ts to ensure we're using the same instance
import { supabase } from './supabase';

// This is a mock/placeholder for code that depends on drizzle
// All actual operations should use the Supabase client directly
export const db = {
  select: () => {
    console.warn('Direct db usage is deprecated - use supabase client instead');
    return {
      from: () => {
        return {
          where: () => {
            return [];
          },
          orderBy: () => {
            return [];
          },
          limit: () => {
            return [];
          }
        };
      }
    };
  },
  insert: () => {
    console.warn('Direct db usage is deprecated - use supabase client instead');
    return {
      values: () => {
        return {
          returning: () => {
            return [];
          }
        };
      }
    };
  },
  update: () => {
    console.warn('Direct db usage is deprecated - use supabase client instead');
    return {
      set: () => {
        return {
          where: () => {
            return {
              returning: () => {
                return [];
              }
            };
          }
        };
      }
    };
  },
  delete: () => {
    console.warn('Direct db usage is deprecated - use supabase client instead');
    return {
      where: () => {
        return {
          returning: () => {
            return [];
          }
        };
      }
    };
  }
};
