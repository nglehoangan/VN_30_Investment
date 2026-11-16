import {vi} from 'vitest';
// Only the disposable DB bootstrap changes; original upgrade assertions run unchanged.
vi.mock('../../../../tests/fixtures/database',async()=>await import('../../../../tests/fixtures/step2-validation-database'));
