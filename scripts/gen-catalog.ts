import { writeFileSync } from 'node:fs';
import { buildCatalogSql } from './catalog-sql';

writeFileSync(new URL('../supabase/catalog.sql', import.meta.url), buildCatalogSql());
console.log('supabase/catalog.sql written');
