import * as migration_20260821_161139_initial from './20260821_161139_initial';
import * as migration_20260821_161200_users_role_default from './20260821_161200_users_role_default';

export const migrations = [
  {
    up: migration_20260821_161139_initial.up,
    down: migration_20260821_161139_initial.down,
    name: '20260821_161139_initial'
  },
  {
    up: migration_20260821_161200_users_role_default.up,
    down: migration_20260821_161200_users_role_default.down,
    name: '20260821_161200_users_role_default'
  },
];
