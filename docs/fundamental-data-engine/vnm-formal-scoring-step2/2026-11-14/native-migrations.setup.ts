import {vi} from 'vitest';
// Replaces only test-database bootstrap; every domain validator/repository and
// all assertions in the original selected regression files run unchanged.
vi.mock('../../../../tests/fixtures/database',async()=>await import('./native-test-database'));
